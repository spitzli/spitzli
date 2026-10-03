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
  OPERATOR_EMAIL: "dominik@spitzli.dev",
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
const { getPayload } = await import("payload");
const { default: config } = await import("../payload.config");
const payload = await getPayload({ config });
const originalSettings = await payload.findGlobal({
  slug: "website-settings",
  overrideAccess: true,
});
await payload.updateGlobal({ slug: "website-settings", overrideAccess: true, data: settings });
const key = rateLimitKey(randomUUID(), "integration-test");
const originalFetch = globalThis.fetch;
let failure: unknown;
const accountIDs: number[] = [];
const realPayloadEmail = payload.email.sendEmail;
try {
  const operator = await payload.create({
    collection: "users",
    overrideAccess: true,
    context: { bootstrap: true },
    data: {
      email: `${randomUUID()}@example.com`,
      name: "Operator test",
      password: randomUUID(),
      role: "operator",
    },
  });
  accountIDs.push(operator.id);
  const customer = await payload.create({
    collection: "users",
    overrideAccess: true,
    context: { bootstrap: true },
    data: {
      email: `${randomUUID()}@example.com`,
      name: "Customer test",
      password: randomUUID(),
      role: "admin",
    },
  });
  accountIDs.push(customer.id);
  const user = { ...customer, collection: "users" as const };
  const recoveryEmails: { to: unknown; html: unknown }[] = [];
  payload.email.sendEmail = async (message) => {
    recoveryEmails.push({ to: message.to, html: message.html });
    return {};
  };
  const token = await payload.forgotPassword({
    collection: "users",
    data: { email: operator.email },
  });
  assert.ok(token, "Recovery returns a token to the trusted local API");
  assert.equal(recoveryEmails.length, 1, "One recovery email was mocked");
  assert.equal(recoveryEmails[0].to, operator.email);
  assert.ok(String(recoveryEmails[0].html).includes(token), "Email carries the actual reset token");
  await assert.rejects(
    payload.resetPassword({
      collection: "users",
      overrideAccess: false,
      data: { token: randomUUID(), password: randomUUID() },
    }),
  );
  const recoveredPassword = randomUUID();
  await payload.resetPassword({
    collection: "users",
    overrideAccess: false,
    data: { token, password: recoveredPassword },
  });
  const login = await payload.login({
    collection: "users",
    data: { email: operator.email, password: recoveredPassword },
  });
  assert.equal(login.user?.role, "operator", "Recovered operator can authenticate");
  await assert.rejects(
    payload.resetPassword({
      collection: "users",
      overrideAccess: false,
      data: { token, password: randomUUID() },
    }),
  );
  await assert.rejects(
    payload.update({
      collection: "users",
      id: operator.id,
      user,
      overrideAccess: true,
      context: { recoveryOperation: "resetPassword", authRecovery: true },
      data: { password: randomUUID() },
    }),
  );

  await assert.rejects(
    payload.update({
      collection: "users",
      id: operator.id,
      user,
      overrideAccess: false,
      data: { password: randomUUID() },
    }),
  );
  await assert.rejects(
    payload.delete({ collection: "users", id: operator.id, user, overrideAccess: false }),
  );
  const attemptedPromotion = await payload.update({
    collection: "users",
    id: customer.id,
    user,
    overrideAccess: false,
    data: { role: "operator" },
  });
  assert.equal(attemptedPromotion.role, "admin", "Customer cannot promote their role");
  await assert.rejects(
    payload.create({
      collection: "users",
      overrideAccess: true,
      data: {
        email: `${randomUUID()}@example.com`,
        name: "Blocked",
        password: randomUUID(),
        role: "admin",
      },
    }),
  );
  const slots = await Promise.all(Array.from({ length: 20 }, () => claimContactSlot(key)));
  assert.equal(slots.filter(Boolean).length, 5, "atomic limit across concurrent calls");
  await contactPool.query(
    "UPDATE spitzli.contact_limits SET expires_at = now() - interval '1 minute' WHERE key = $1",
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
  await contactPool.query("DELETE FROM spitzli.contact_limits WHERE key = $1", [localKey]);
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
  await contactPool.query("DELETE FROM spitzli.contact_limits WHERE key = $1", [localKey]);
  console.log(
    "PASS: protected operator recovery with mocked email, access controls, concurrent limiter and contact delivery.",
  );
} catch (error) {
  failure = error;
} finally {
  globalThis.fetch = originalFetch;
  payload.email.sendEmail = realPayloadEmail;
  await contactPool.query("DELETE FROM spitzli.contact_limits WHERE key = $1", [key]);
  await contactPool.end();
  await payload.updateGlobal({
    slug: "website-settings",
    overrideAccess: true,
    data: originalSettings,
  });
  for (const id of accountIDs)
    await payload.db.deleteOne({ collection: "users", where: { id: { equals: id } } });
  await payload.destroy();
}
if (failure) console.error(failure);
process.exit(failure ? 1 : 0);
