import assert from "node:assert/strict";
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
