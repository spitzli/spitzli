import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import type { PostgresAdapter } from "@payloadcms/db-postgres";
import { APIError, type CollectionConfig, type GlobalConfig, type PayloadRequest } from "payload";
import config from "../payload.config";
import { protectContent } from "../src/lib/instance-users";

test("Independent CMS uses the spitzli schema, explicit migrations and protected admin", async () => {
  const resolved = await config;
  assert.equal(resolved.admin.user, "users");
  assert.equal(resolved.localization ? resolved.localization.defaultLocale : undefined, "en");
  const db = resolved.db.init({ payload: {} as never }) as PostgresAdapter;
  assert.equal(db.schemaName, "spitzli");
  assert.equal(db.push, false);
  assert.match(db.migrationDir, /migrations-instance$/);
  assert.ok(resolved.collections.find((collection) => collection.slug === "projects")?.versions);
});

test("CMS write roles guard native writes and deletion; jobs stay operator-only", async () => {
  const resolved = await config;
  const guarded = protectContent<CollectionConfig>({ slug: "guard-test", fields: [] });
  for (const role of ["operator", "admin", "editor", "reader", "unknown", null]) {
    const req = { user: role ? { collection: "users", role } : null } as PayloadRequest;
    for (const operation of ["create", "update", "delete"] as const)
      assert.equal(
        await guarded.access?.[operation]?.({ req, slug: "guard-test" }),
        operation === "delete"
          ? role === "operator" || role === "admin"
          : role === "operator" || role === "admin" || role === "editor",
      );
    for (const operation of ["run", "queue", "cancel"] as const)
      assert.equal(await resolved.jobs.access?.[operation]?.({ req }), role === "operator");
  }
});

test("CMS origin can differ from the canonical website while previews remain isolated", () => {
  for (const [environment, cmsOrigin, expectedCMS, expectedSite] of [
    [
      "production",
      "https://spitzli.vercel.app",
      "https://spitzli.vercel.app",
      "https://spitzli.dev",
    ],
    [
      "preview",
      "https://spitzli.vercel.app",
      "https://preview.example.com",
      "https://preview.example.com",
    ],
    ["production", "", "https://spitzli.dev", "https://spitzli.dev"],
  ]) {
    const result = JSON.parse(
      execFileSync(
        process.execPath,
        [
          "--import",
          "tsx",
          "--input-type=module",
          "-e",
          `
      import config from './payload.config.ts';
      import {site} from './src/lib/site.ts';
      const {serverURL,csrf,cors}=await config;
      console.log(JSON.stringify({serverURL,csrf,cors,siteURL:site.url}));
    `,
        ],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            SITE_URL: "https://spitzli.dev",
            NEXT_PUBLIC_SERVER_URL: cmsOrigin,
            VERCEL_ENV: environment,
            VERCEL_URL: "preview.example.com",
          },
        },
      ),
    );
    assert.equal(result.serverURL, expectedCMS);
    assert.equal(result.siteURL, expectedSite);
    assert.deepEqual(new Set(result.csrf), new Set([expectedSite, expectedCMS]));
    assert.deepEqual(new Set(result.cors), new Set([expectedSite, expectedCMS]));
  }
});

test("CMS role guards preserve existing access rules and reject other user collections", async () => {
  const guarded = protectContent<CollectionConfig>({
    slug: "guard-test",
    fields: [],
    access: { update: () => false, delete: () => ({ owner: { equals: "allowed" } }) },
  });
  for (const role of ["operator", "admin", "editor"]) {
    const req = { user: { collection: "users", role } } as PayloadRequest;
    assert.equal(await guarded.access?.update?.({ req, slug: "guard-test" }), false);
    assert.deepEqual(
      await guarded.access?.delete?.({ req, slug: "guard-test" }),
      role === "editor" ? false : { owner: { equals: "allowed" } },
    );
    req.user = { collection: "other", role } as never;
    assert.equal(await guarded.access?.create?.({ req, slug: "guard-test" }), false);
  }
});

test("Native version restoration requires an administrator for collections and globals", async () => {
  for (const kind of ["collection", "global"]) {
    let preservedHookCalls = 0;
    const input = {
      slug: "guard-test",
      fields: [],
      hooks: {
        beforeOperation: [
          () => {
            preservedHookCalls++;
          },
        ],
      },
    };
    const guarded = protectContent(input as CollectionConfig | GlobalConfig);
    const invoke = async (role: string, operation: string) => {
      const req = { user: { collection: "users", role } } as PayloadRequest;
      for (const hook of guarded.hooks?.beforeOperation || [])
        await hook({ operation, req } as never);
    };
    for (const role of ["editor", "reader", "unknown"]) {
      await assert.rejects(
        invoke(role, "restoreVersion"),
        (error: unknown) => error instanceof APIError && error.status === 403,
        kind,
      );
    }
    assert.equal(preservedHookCalls, 0);
    for (const role of ["admin", "operator"]) await invoke(role, "restoreVersion");
    await invoke("editor", "update");
    assert.equal(preservedHookCalls, 3);
  }
});
