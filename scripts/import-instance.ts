import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getPayload, type JsonObject, type PayloadRequest } from "payload";
import config from "../payload.config";

// One-time, transactionally import the private archive into an empty instance schema.
// Adapter writes intentionally preserve locale maps, timestamps, IDs, upload metadata and history.
const archivePath = process.argv[2];
if (!archivePath || process.env.INSTANCE_IMPORT !== "spitzli")
  throw new Error("Set INSTANCE_IMPORT=spitzli and supply the private export path.");
const archive = JSON.parse(await readFile(archivePath, "utf8"));
for (const key of ["clients", "media", "projects", "drafts", "versions", "users"])
  assert.ok(Array.isArray(archive[key]), `Missing export array: ${key}`);
assert.ok(archive.settings, "Missing website settings");

const payload = await getPayload({ config });
let transactionID: Awaited<ReturnType<typeof payload.db.beginTransaction>> = null;
try {
  assert.equal(payload.db.schemaName, "spitzli");
  const identity = await payload.db.pool.query("SELECT current_user AS role");
  assert.equal(identity.rows[0].role, "spitzli_runtime", "Use the restricted instance role");
  for (const collection of ["users", "clients", "media", "projects"] as const) {
    const count = await payload.count({ collection, overrideAccess: true });
    assert.equal(count.totalDocs, 0, `Refusing to overwrite existing ${collection}`);
  }
  transactionID = await payload.db.beginTransaction();
  assert.ok(transactionID, "Import requires a database transaction");
  const req: Partial<PayloadRequest> = {
    transactionID,
    context: { instanceImport: true },
    payload,
  };
  const clean = (doc: JsonObject) => {
    const {
      site: _site,
      tenant: _tenant,
      sourceID: _sourceID,
      legacyID: _legacyID,
      globalType: _globalType,
      ...data
    } = doc;
    return data;
  };
  for (const collection of ["users", "clients", "media", "projects"] as const) {
    for (const source of archive[collection]) {
      const data = clean(source);
      if (collection === "users") {
        assert.ok(data.hash && data.salt, "User export must include auth hashes");
        assert.ok(
          ["operator", "admin", "editor", "reader"].includes(data.role),
          "Unmapped user role",
        );
      }
      if (collection === "media") {
        assert.ok(
          String(data.prefix).startsWith("instances/spitzli"),
          "Media must be copied to the instance-owned prefix first",
        );
      }
      await payload.db.create({ collection, customID: data.id, data, req });
    }
  }
  await payload.db.updateGlobal({ slug: "website-settings", data: clean(archive.settings), req });
  const versions = archive.versions.toSorted((a: JsonObject, b: JsonObject) =>
    a.updatedAt.localeCompare(b.updatedAt),
  );
  const importedVersions = [];
  for (const source of versions) {
    const version = await payload.db.createVersion({
      collectionSlug: "projects",
      parent: typeof source.parent === "object" ? source.parent.id : source.parent,
      versionData: clean(source.version),
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
      autosave: source.autosave ?? false,
      publishedLocale: source.publishedLocale,
      snapshot: source.snapshot || undefined,
      req,
    });
    importedVersions.push({ id: version.id, source });
  }
  // Equal timestamps and locale snapshots can have distinct latest flags in the source.
  for (const { id, source } of importedVersions) {
    await payload.db.updateVersion({
      collection: "projects",
      id,
      versionData: {
        version: clean(source.version),
        latest: source.latest,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
      },
      req,
    });
  }
  await payload.db.commitTransaction(transactionID);
  transactionID = null;
  const serials = await payload.db.pool.query(`
    SELECT table_name, column_name, pg_get_serial_sequence(format('%I.%I', table_schema, table_name), column_name) AS sequence
    FROM information_schema.columns WHERE table_schema = 'spitzli' AND column_default LIKE 'nextval%'
  `);
  for (const { table_name, column_name, sequence } of serials.rows) {
    assert.match(table_name, /^[a-z0-9_]+$/);
    assert.match(column_name, /^[a-z0-9_]+$/);
    await payload.db.pool.query(
      `SELECT setval($1::regclass, COALESCE((SELECT MAX("${column_name}") FROM "spitzli"."${table_name}"), 1), EXISTS(SELECT 1 FROM "spitzli"."${table_name}"))`,
      [sequence],
    );
  }
  console.log(
    JSON.stringify({
      imported: {
        users: archive.users.length,
        clients: archive.clients.length,
        media: archive.media.length,
        projects: archive.projects.length,
        versions: archive.versions.length,
      },
    }),
  );
} catch (error) {
  if (transactionID) await payload.db.rollbackTransaction(transactionID);
  throw error;
} finally {
  await payload.destroy();
}
process.exit(0);
