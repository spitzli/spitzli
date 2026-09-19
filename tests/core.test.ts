import assert from "node:assert/strict";
import { test } from "node:test";
import { missingEnvironment } from "../scripts/check-env.mjs";
import { rateLimitKey, readLimitedJSON, validateContact } from "../src/lib/contact";
import { isPublicURL, referenceURL } from "../src/lib/links";

const valid = {
  name: "Ada Beispiel",
  email: "ada@example.com",
  message: "Ich möchte eine interne Anwendung entwickeln.",
  website: "",
};

test("Contact boundary: lengths, objects, header injection and Unicode", async () => {
  assert.deepEqual(validateContact(valid).data, valid);
  for (const bad of [
    null,
    [],
    "text",
    { ...valid, name: "A" },
    { ...valid, email: "bad" },
    { ...valid, email: "ada@example.com\r\nBcc: victim@example.com" },
    { ...valid, name: "Ada\nBcc: victim@example.com" },
    { ...valid, message: "short" },
    { ...valid, message: "x".repeat(5001) },
    { ...valid, email: {} },
    { ...valid, website: {} },
  ]) {
    assert.equal(validateContact(bad).data, undefined);
  }
  assert.ok(validateContact({ ...valid, name: "Jörg Weiß" }).data);
  const req = (body: string) => new Request("http://localhost", { method: "POST", body });
  assert.deepEqual(await readLimitedJSON(req(JSON.stringify(valid))), valid);
  await assert.rejects(readLimitedJSON(req("x".repeat(17000))), RangeError);
  await assert.rejects(readLimitedJSON(req("{")), SyntaxError);
  assert.notEqual(rateLimitKey("192.0.2.1", "secret-a"), rateLimitKey("192.0.2.1", "secret-b"));
  assert.match(rateLimitKey("192.0.2.1", "secret-a"), /^[a-f0-9]{64}$/);
});

test("Portfolio links: HTTPS only, fixed UTM, preserve query/anchor and repository URLs", () => {
  for (const value of [
    "javascript:alert(1)",
    "//example.com",
    "http://example.com",
    "https://me:secret@example.com",
    "https://127.0.0.1",
    "https://host.local",
    "https://[::1]",
    "not a url",
  ])
    assert.equal(isPublicURL(value), false, value);
  const url = new URL(referenceURL("https://example.com/docs?language=de&utm_source=old#api"));
  assert.equal(url.searchParams.get("language"), "de");
  assert.equal(url.searchParams.get("utm_source"), "spitzli.dev");
  assert.equal(url.searchParams.get("utm_campaign"), "reference");
  assert.equal(url.hash, "#api");
  assert.equal(
    referenceURL("https://github.com/spitzli/spitzli"),
    "https://github.com/spitzli/spitzli",
  );
  assert.throws(() => referenceURL("javascript:alert(1)"));
});

test("Production stays blocked without legal, privacy, persistent storage and delivery configuration", () => {
  const dev = { DATABASE_URL: "postgresql://localhost/db", PAYLOAD_SECRET: "a".repeat(48) };
  assert.equal(missingEnvironment(dev).length, 0);
  const missing = missingEnvironment(dev, true);
  for (const key of [
    "LEGAL_STREET",
    "BLOB_READ_WRITE_TOKEN",
    "SMTP_PASSWORD",
    "PRIVACY_TRANSFERS",
    "LEGAL_REVIEWED=true",
  ])
    assert.ok(missing.includes(key));
  assert.ok(missingEnvironment({ ...dev, PAYLOAD_SECRET: "weak" }).length);
});
