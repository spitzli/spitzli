import { hasCaptchaConfig } from "../src/lib/hcaptcha.mjs";

export function missingEnvironment(env, production = false) {
  const missing = ["DATABASE_URL", "PAYLOAD_SECRET", "OPERATOR_EMAIL"].filter((key) => !env[key]);
  if (env.PAYLOAD_SECRET && env.PAYLOAD_SECRET.length < 32)
    missing.push("PAYLOAD_SECRET (mindestens 32 Zeichen)");
  if (production) {
    for (const key of [
      "SITE_URL",
      ...(env.CONTACT_ENABLED === "true"
        ? [
            "SMTP_HOST",
            "SMTP_USER",
            "SMTP_PASSWORD",
            "SMTP_FROM",
            "HCAPTCHA_SITE_KEY",
            "HCAPTCHA_SECRET",
          ]
        : []),
    ]) {
      if (!env[key]?.trim()) missing.push(key);
    }
    if (
      env.CONTACT_ENABLED === "true" &&
      env.HCAPTCHA_SITE_KEY &&
      env.HCAPTCHA_SECRET &&
      !hasCaptchaConfig({ ...env, VERCEL_ENV: "production" })
    )
      missing.push("hCaptcha (gültige Produktionsschlüssel erforderlich)");
    try {
      const url = new URL(env.SITE_URL);
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      )
        missing.push("SITE_URL (HTTPS-Origin)");
    } catch {
      missing.push("SITE_URL (gültige URL)");
    }
  }
  if (env.SMTP_PORT && !["465", "587", "2525"].includes(env.SMTP_PORT))
    missing.push("SMTP_PORT (465, 587 oder 2525)");
  return missing;
}

if (process.argv[1]?.endsWith("/check-env.mjs")) {
  const production =
    process.argv.includes("--production") || process.env.VERCEL_ENV === "production";
  const missing = missingEnvironment(process.env, production);
  if (missing.length) {
    console.error(`Build gesperrt. Fehlende/ungültige Konfiguration:\n- ${missing.join("\n- ")}`);
    process.exit(1);
  }
  console.log(
    production
      ? "Produktions-Konfiguration vollständig."
      : "Entwicklungs-/Preview-Konfiguration vollständig.",
  );
}
