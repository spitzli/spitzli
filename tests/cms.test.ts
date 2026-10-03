import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import type { PostgresAdapter } from "@payloadcms/db-postgres";
import type { CollectionConfig, PayloadRequest } from "payload";
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

test("Reader guards cover default write access and jobs stay operator-only", async () => {
  const resolved = await config;
  const guarded = protectContent<CollectionConfig>({ slug: "guard-test", fields: [] });
  for (const role of ["operator", "admin", "editor", "reader", null]) {
    const req = { user: role ? { collection: "users", role } : null } as PayloadRequest;
    for (const operation of ["create", "update", "delete"] as const)
      assert.equal(
        await guarded.access?.[operation]?.({ req, slug: "guard-test" }),
        role !== null && role !== "reader",
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
