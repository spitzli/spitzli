import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { rateLimitKey } from "../src/lib/contact";

if (!["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL || "").hostname))
  throw new Error("Integration tests require a local disposable database.");
Object.assign(process.env, {
  VERCEL: "",
  VERCEL_ENV: "",
  CONTACT_ENABLED: "true",
  CMS_URL: "http://127.0.0.1:3108",
  CMS_SITE_KEY: "spitzli",
  CMS_API_KEY: "test",
  HCAPTCHA_SITE_KEY: "10000000-ffff-ffff-ffff-000000000001",
  HCAPTCHA_SECRET: "0x0000000000000000000000000000000000000000",
  SMTP_HOST: "127.0.0.1",
  SMTP_USER: "test",
  SMTP_PASSWORD: "test",
  SMTP_FROM: "sender@example.com",
  SITE_URL: "http://localhost:3000",
});
const { contactPool, claimContactSlot } = await import("../src/lib/rate-limit");
const { mailTransport } = await import("../src/lib/mail");
const settings = {
  name: "Test",
  owner: "Test Owner",
  email: "cms-recipient@example.com",
  street: "Test 1",
  postcode: "12345",
  city: "Test",
  country: "Deutschland",
  legalReviewed: true,
  privacyReviewed: true,
  databaseProvider: "test",
  databaseRegion: "test",
  logRetention: "test",
  mailProvider: "test",
  transfers: "test",
};
const key = rateLimitKey(randomUUID(), "integration-test");
const originalFetch = globalThis.fetch;
let failure: unknown;
try {
  const slots = await Promise.all(Array.from({ length: 20 }, () => claimContactSlot(key)));
  assert.equal(slots.filter(Boolean).length, 5, "atomic limit across concurrent calls");
  await contactPool.query(
    "UPDATE contact_limits SET expires_at = now() - interval '1 minute' WHERE key = $1",
    [key],
  );
  assert.equal(await claimContactSlot(key), true, "expired bucket resets");
  const { POST } = await import("../src/app/(site)/api/contact/route");
  let delivered = 0;
  const realSend = mailTransport.sendMail;
  mailTransport.sendMail = async (message) => {
    assert.equal(message.to, "cms-recipient@example.com");
    assert.equal(message.replyTo, "ada@example.com");
    assert.equal(message.html, undefined);
    delivered++;
    return {} as SMTPTransport.SentMessageInfo;
  };
  let captchaCalls = 0;
  let captchaMode: "valid" | "invalid" | "offline" = "valid";
  globalThis.fetch = async (input, init) => {
    if (String(input).includes("/api/content/v1/")) return Response.json(settings);
    assert.equal(input, "https://api.hcaptcha.com/siteverify");
    assert.ok(init?.body instanceof URLSearchParams);
    assert.equal(init.body.get("sitekey"), process.env.HCAPTCHA_SITE_KEY);
    captchaCalls++;
    if (captchaMode === "offline") throw new Error("simulated hCaptcha outage");
    return Response.json({ success: captchaMode === "valid" });
  };
  const valid = {
    name: "Ada Beispiel",
    email: "ada@example.com",
    message: "Ich möchte eine interne Anwendung entwickeln.",
    website: "",
    captcha: "integration-test-token",
  };
  const request = (data: unknown, origin = "http://localhost:3000") =>
    new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify(data),
    });
  const localKey = rateLimitKey("127.0.0.1", process.env.PAYLOAD_SECRET || "");
  await contactPool.query("DELETE FROM contact_limits WHERE key = $1", [localKey]);
  assert.equal((await POST(request(valid, "https://other.example"))).status, 403);
  const invalidEnglish = await POST(request({ ...valid, message: "x" }));
  assert.equal(invalidEnglish.status, 400);
  assert.equal(
    (await invalidEnglish.json()).fields.message,
    "Please write a message with 20–5,000 characters.",
  );
  const invalidGerman = request({ ...valid, message: "x" });
  invalidGerman.headers.set("accept-language", "de");
  assert.equal(
    (await (await POST(invalidGerman)).json()).fields.message,
    "Bitte eine Nachricht mit 20–5.000 Zeichen schreiben.",
  );
  assert.equal((await POST(request({ ...valid, message: "x".repeat(17000) }))).status, 413);
  assert.equal((await POST(request({ ...valid, website: "spam" }))).status, 200);
  assert.equal(delivered, 0);
  assert.equal(captchaCalls, 0, "honeypot must not trigger a verification or mail");
  assert.equal((await POST(request({ ...valid, captcha: "" }))).status, 400);
  captchaMode = "invalid";
  assert.equal((await POST(request(valid))).status, 400);
  assert.equal(delivered, 0, "invalid CAPTCHA cannot send mail");
  captchaMode = "offline";
  assert.equal((await POST(request(valid))).status, 503);
  assert.equal(delivered, 0, "CAPTCHA outage cannot send mail");
  captchaMode = "valid";
  assert.equal((await POST(request(valid))).status, 200);
  assert.equal(delivered, 1);
  mailTransport.sendMail = async () => {
    throw new Error("simulated mail failure");
  };
  assert.equal(
    (await POST(request(valid))).status,
    503,
    "never report success on transport failure",
  );
  captchaMode = "invalid";
  assert.equal((await POST(request(valid))).status, 400);
  const callsBeforeLimit = captchaCalls;
  assert.equal((await POST(request(valid))).status, 429);
  assert.equal(captchaCalls, callsBeforeLimit, "rate limit applies before the vendor request");
  mailTransport.sendMail = realSend;
  process.env.CONTACT_ENABLED = "false";
  assert.equal((await POST(request(valid))).status, 503);
  await contactPool.query("DELETE FROM contact_limits WHERE key = $1", [localKey]);
  console.log("PASS: concurrent limiter, expiry, contact validation and mocked mail delivery.");
} catch (error) {
  failure = error;
} finally {
  globalThis.fetch = originalFetch;
  await contactPool.query("DELETE FROM contact_limits WHERE key = $1", [key]);
  await contactPool.end();
}
if (failure) console.error(failure);
process.exit(failure ? 1 : 0);
