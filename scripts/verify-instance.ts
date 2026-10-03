import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getPayload, type JsonObject } from "payload";
import config from "../payload.config";

const archive = JSON.parse(await readFile(process.argv[2], "utf8"));
const payload = await getPayload({ config });
// Compare exported fields, allowing the destination's additional optional defaults.
function compare(source: unknown, target: unknown, location: string): void {
  if (source === null || source === undefined) {
    assert.ok(target === null || target === undefined, location);
  } else if (Array.isArray(source)) {
    assert.ok(Array.isArray(target), location);
    assert.equal(target.length, source.length, location);
    source.forEach((value, index) => {
      compare(value, target[index], `${location}[${index}]`);
    });
  } else if (typeof source === "object") {
    assert.ok(target && typeof target === "object", location);
    for (const [key, value] of Object.entries(source)) {
      if (["site", "tenant", "sourceID", "legacyID", "globalType", "collection"].includes(key))
        continue;
      compare(value, (target as JsonObject)[key], `${location}.${key}`);
    }
  } else assert.equal(target, source, location);
}
try {
  for (const collection of ["clients", "media", "projects"] as const) {
    const result = await payload.find({
      collection,
      locale: "all",
      depth: 0,
      pagination: false,
      overrideAccess: true,
    });
    assert.equal(result.totalDocs, archive[collection].length, `${collection} count`);
    for (const source of archive[collection]) {
      const target = result.docs.find((doc) => doc.id === source.id);
      compare(source, target, `${collection}:${source.id}`);
    }
  }
  const settings = await payload.findGlobal({ slug: "website-settings", overrideAccess: true });
  const { id: _settingsID, ...sourceSettings } = archive.settings;
  compare(sourceSettings, settings, "settings");
  const drafts = await payload.find({
    collection: "projects",
    locale: "all",
    depth: 0,
    pagination: false,
    overrideAccess: true,
    draft: true,
  });
  assert.equal(drafts.totalDocs, archive.drafts.length, "draft count");
  for (const source of archive.drafts)
    compare(
      source,
      drafts.docs.find((doc) => doc.id === source.id),
      `draft:${source.id}`,
    );
  const versions = await payload.findVersions({
    collection: "projects",
    locale: "all",
    depth: 0,
    pagination: false,
    overrideAccess: true,
    sort: ["updatedAt", "id"],
  });
  assert.equal(versions.totalDocs, archive.versions.length, "version count");
  for (const source of archive.versions) {
    const { id: _versionID, ...version } = source;
    const target = versions.docs.find(
      (doc) =>
        doc.parent === source.parent &&
        doc.createdAt === source.createdAt &&
        doc.updatedAt === source.updatedAt &&
        doc.publishedLocale === source.publishedLocale,
    );
    compare(version, target, `version:${source.id}`);
  }
  const users = await payload.db.find({ collection: "users", pagination: false, limit: 1000 });
  assert.equal(users.docs.length, archive.users.length, "user count");
  for (const source of archive.users) {
    const target = users.docs.find((doc) => doc.id === source.id);
    assert.ok(target, "Missing user");
    for (const key of ["email", "role", "hash", "salt"]) {
      // Do not expose values in assertion output: hashes are private credentials.
      assert.ok(source[key] === (target as JsonObject)[key], `User ${source.id}: ${key} differs`);
    }
  }
  console.log(
    "PASS: IDs, localized content, settings, drafts, complete version history, media metadata and account credentials match the archive.",
  );
} finally {
  await payload.destroy();
}
process.exit(0);
