import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { sql } from "@payloadcms/db-postgres";
import { getPayload } from "payload";
import { rateLimitKey } from "../src/lib/contact";
import { claimContactSlot } from "../src/lib/rate-limit";

if (!["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL || "").hostname))
  throw new Error("Integration tests require a local disposable database.");
// Synthetic values never leave this local test process; mail delivery is mocked below.
Object.assign(process.env, {
  VERCEL: "",
  VERCEL_ENV: "",
  CONTACT_ENABLED: "true",
  LEGAL_STREET: "Test",
  LEGAL_POSTCODE: "00000",
  LEGAL_CITY: "Test",
  LEGAL_REVIEWED: "true",
  PRIVACY_REVIEWED: "true",
  PRIVACY_DATABASE_PROVIDER: "test",
  PRIVACY_DATABASE_REGION: "test",
  PRIVACY_LOG_RETENTION: "test",
  PRIVACY_MAIL_PROVIDER: "test",
  PRIVACY_TRANSFERS: "test",
  SMTP_HOST: "127.0.0.1",
  SMTP_USER: "test",
  SMTP_PASSWORD: "test",
  SMTP_FROM: "sender@example.com",
  SITE_URL: "http://localhost:3000",
});
const { default: config } = await import("../payload.config");
const payload = await getPayload({ config });
const slug = `test-${randomUUID()}`;
const key = rateLimitKey(slug, "integration-test");
let projectID: number | undefined;
let failure: unknown;
try {
  await assert.rejects(
    payload.create({
      collection: "users",
      overrideAccess: true,
      data: { email: "uninvited@example.com", password: randomUUID(), name: "Blocked" },
    }),
  );
  const draft = await payload.create({
    collection: "projects",
    data: {
      name: "Unpublished test",
      slug,
      category: "Webapps",
      summary: "Private draft",
      _status: "draft",
      sortOrder: 999,
    },
  });
  projectID = draft.id;
  const { getProject, getProjects } = await import("../src/lib/projects");
  assert.equal(await getProject(slug), null);
  assert.equal(
    (await getProjects()).some((project) => project.slug === slug),
    false,
  );
  await assert.rejects(payload.find({ collection: "clients", overrideAccess: false }));
  assert.equal(
    (
      await payload.find({
        collection: "projects",
        overrideAccess: false,
        where: { slug: { equals: slug } },
      })
    ).totalDocs,
    0,
  );
  assert.equal(
    (
      await payload.find({
        collection: "projects",
        overrideAccess: false,
        draft: true,
        where: { slug: { equals: slug } },
      })
    ).totalDocs,
    0,
  );
  await assert.rejects(
    payload.update({
      collection: "projects",
      id: draft.id,
      overrideAccess: false,
      data: { name: "Unauthenticated edit" },
    }),
  );
  await assert.rejects(payload.find({ collection: "users", overrideAccess: false }));
  await assert.rejects(payload.find({ collection: "contact-limits", overrideAccess: false }));
  await payload.update({ collection: "projects", id: draft.id, data: { _status: "published" } });
  assert.equal(
    (
      await payload.find({
        collection: "projects",
        overrideAccess: false,
        where: { slug: { equals: slug } },
      })
    ).totalDocs,
    1,
  );
  const slots = await Promise.all(Array.from({ length: 20 }, () => claimContactSlot(payload, key)));
  assert.equal(slots.filter(Boolean).length, 5, "atomic limit across concurrent calls");
  await payload.db.drizzle.execute(
    sql`UPDATE contact_limits SET expires_at = now() - interval '1 minute' WHERE key = ${key}`,
  );
  assert.equal(await claimContactSlot(payload, key), true, "expired bucket resets");

  const { POST } = await import("../src/app/(site)/api/contact/route");
  let delivered = 0;
  const realSend = payload.sendEmail;
  payload.sendEmail = async (message) => {
    assert.equal(message.to, "dominik@spitzli.dev");
    assert.equal(message.replyTo, "ada@example.com");
    assert.equal(message.html, undefined);
    delivered++;
  };
  const valid = {
    name: "Ada Beispiel",
    email: "ada@example.com",
    message: "Ich möchte eine interne Anwendung entwickeln.",
    website: "",
  };
  const request = (data: unknown, origin = "http://localhost:3000") =>
    new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify(data),
    });
  const localKey = rateLimitKey("127.0.0.1", process.env.PAYLOAD_SECRET || "");
  await payload.db.drizzle.execute(sql`DELETE FROM contact_limits WHERE key = ${localKey}`);
  assert.equal((await POST(request(valid, "https://other.example"))).status, 403);
  assert.equal((await POST(request({ ...valid, message: "x" }))).status, 400);
  assert.equal((await POST(request({ ...valid, message: "x".repeat(17000) }))).status, 413);
  assert.equal((await POST(request({ ...valid, website: "spam" }))).status, 200);
  assert.equal(delivered, 0);
  assert.equal((await POST(request(valid))).status, 200);
  assert.equal(delivered, 1);
  payload.sendEmail = async () => {
    throw new Error("simulated mail failure");
  };
  assert.equal(
    (await POST(request(valid))).status,
    503,
    "never report success on transport failure",
  );
  payload.sendEmail = realSend;
  process.env.CONTACT_ENABLED = "false";
  assert.equal((await POST(request(valid))).status, 503);
  await payload.db.drizzle.execute(sql`DELETE FROM contact_limits WHERE key = ${localKey}`);
  console.log(
    "PASS: admin isolation, drafts, published reads, concurrent limiter, expiry, contact validation and mocked mail delivery.",
  );
} catch (error) {
  failure = error;
} finally {
  if (projectID) await payload.delete({ collection: "projects", id: projectID });
  await payload.db.drizzle.execute(sql`DELETE FROM contact_limits WHERE key = ${key}`);
  await payload.destroy();
}
if (failure) console.error(failure);
process.exit(failure ? 1 : 0);
