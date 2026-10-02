const testSiteKeys = new Set([
  "10000000-ffff-ffff-ffff-000000000001",
  "20000000-ffff-ffff-ffff-000000000002",
  "30000000-ffff-ffff-ffff-000000000003",
]);

/** @param {Record<string, string | undefined>} env */
export function hasCaptchaConfig(env = process.env) {
  const siteKey = env.HCAPTCHA_SITE_KEY?.trim();
  const secret = env.HCAPTCHA_SECRET?.trim();
  return Boolean(
    siteKey &&
      /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(siteKey) &&
      secret &&
      secret !== "[SENSITIVE]" &&
      !(
        env.VERCEL_ENV === "production" &&
        (testSiteKeys.has(siteKey.toLowerCase()) ||
          secret === "0x0000000000000000000000000000000000000000")
      ),
  );
}

/** @param {string} token @param {string} ip */
export async function verifyCaptcha(token, ip) {
  if (!hasCaptchaConfig()) return "unavailable";
  if (!token || token.length > 8192 || /\s/.test(token)) return "rejected";
  try {
    const response = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET.trim(),
        response: token,
        sitekey: process.env.HCAPTCHA_SITE_KEY.trim(),
        remoteip: ip,
      }),
    });
    if (!response.ok) return "unavailable";
    const result = await response.json();
    // Configuration errors are service failures, not something the visitor can fix by solving again.
    if (
      Array.isArray(result?.["error-codes"]) &&
      result["error-codes"].some((code) =>
        [
          "missing-input-secret",
          "invalid-input-secret",
          "sitekey-secret-mismatch",
          "not-using-dummy-passcode",
          "bad-request",
          "missing-remoteip",
          "invalid-remoteip",
        ].includes(code),
      )
    )
      return "unavailable";
    // Sitekey binding and one-time/expiry validation belong to siteverify. Its hostname is not authentication.
    if (result?.success === true) return "verified";
    return result?.success === false ? "rejected" : "unavailable";
  } catch {
    // Never log the token, secret, submitted form data or the vendor response.
    return "unavailable";
  }
}
