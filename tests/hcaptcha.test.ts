import assert from "node:assert/strict";
import { test } from "node:test";
import { hasCaptchaConfig, verifyCaptcha } from "../src/lib/hcaptcha.mjs";

const siteKey = "10000000-ffff-ffff-ffff-000000000001";
const secret = "0x0000000000000000000000000000000000000000";
test("hCaptcha configuration rejects placeholders and production test credentials", () => {
  const env = { HCAPTCHA_SITE_KEY: siteKey, HCAPTCHA_SECRET: secret };
  assert.equal(hasCaptchaConfig(env), true);
  assert.equal(hasCaptchaConfig({ ...env, VERCEL_ENV: "production" }), false);
  assert.equal(
    hasCaptchaConfig({
      ...env,
      HCAPTCHA_SITE_KEY: siteKey.toUpperCase(),
      VERCEL_ENV: "production",
    }),
    false,
  );
  assert.equal(hasCaptchaConfig({ ...env, HCAPTCHA_SECRET: "[SENSITIVE]" }), false);
  assert.equal(hasCaptchaConfig({ ...env, HCAPTCHA_SECRET: "" }), false);
  assert.equal(hasCaptchaConfig({ ...env, HCAPTCHA_SITE_KEY: "not-a-key" }), false);
});

test("siteverify binds the key, form-encodes credentials and fails closed without leaking data", async () => {
  const originalFetch = globalThis.fetch;
  const previous = {
    HCAPTCHA_SITE_KEY: process.env.HCAPTCHA_SITE_KEY,
    HCAPTCHA_SECRET: process.env.HCAPTCHA_SECRET,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };
  Object.assign(process.env, {
    HCAPTCHA_SITE_KEY: siteKey,
    HCAPTCHA_SECRET: secret,
    VERCEL_ENV: "",
  });
  let calls = 0;
  let answer: unknown = { success: true, hostname: "not-provided" };
  globalThis.fetch = async (input, init) => {
    calls++;
    assert.equal(input, "https://api.hcaptcha.com/siteverify");
    assert.equal(init?.method, "POST");
    assert.equal(init?.cache, "no-store");
    assert.equal(init?.redirect, "error");
    assert.ok(init?.signal instanceof AbortSignal);
    const body = init?.body;
    assert.ok(body instanceof URLSearchParams);
    assert.equal(body.get("secret"), secret);
    assert.equal(body.get("sitekey"), siteKey);
    assert.equal(body.get("remoteip"), "192.0.2.1");
    assert.equal(body.get("response"), "opaque&secret=attacker");
    assert.deepEqual([...body.keys()].sort(), ["remoteip", "response", "secret", "sitekey"]);
    return Response.json(answer);
  };
  try {
    assert.equal(await verifyCaptcha("", "192.0.2.1"), "rejected");
    assert.equal(calls, 0);
    assert.equal(await verifyCaptcha("opaque&secret=attacker", "192.0.2.1"), "verified");
    for (const code of [
      "invalid-input-response",
      "expired-input-response",
      "already-seen-response",
    ]) {
      answer = { success: false, "error-codes": [code] };
      assert.equal(await verifyCaptcha("opaque&secret=attacker", "192.0.2.1"), "rejected");
    }
    for (const code of [
      "invalid-input-secret",
      "sitekey-secret-mismatch",
      "not-using-dummy-passcode",
    ]) {
      answer = { success: false, "error-codes": [code] };
      assert.equal(await verifyCaptcha("opaque&secret=attacker", "192.0.2.1"), "unavailable");
    }
    for (const malformed of [null, [], {}, { success: "true" }]) {
      answer = malformed;
      assert.equal(await verifyCaptcha("opaque&secret=attacker", "192.0.2.1"), "unavailable");
    }
    globalThis.fetch = async () => new Response("service failed", { status: 503 });
    assert.equal(await verifyCaptcha("token", "192.0.2.1"), "unavailable");
    globalThis.fetch = async () => new Response("not json");
    assert.equal(await verifyCaptcha("token", "192.0.2.1"), "unavailable");
    globalThis.fetch = async () => {
      throw new DOMException("Timeout", "TimeoutError");
    };
    assert.equal(await verifyCaptcha("token", "192.0.2.1"), "unavailable");
    delete process.env.HCAPTCHA_SECRET;
    assert.equal(await verifyCaptcha("token", "192.0.2.1"), "unavailable");
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
