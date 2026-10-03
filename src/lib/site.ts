import type { WebsiteSetting } from "../content-types";
import { hasCaptchaConfig } from "./hcaptcha.mjs";

export const site = {
  url:
    process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.SITE_URL || "http://localhost:3000",
  github: "https://github.com/NewtTheWolf",
  companyGithub: "https://github.com/spitzli",
  description:
    "Ich entwickle Webanwendungen, APIs und Cloud-Infrastruktur. Dominik Spitzli — selbstständiger Softwareentwickler und Systemarchitekt.",
};

export function legalReady(settings: Partial<WebsiteSetting>) {
  return Boolean(
    settings.legalReviewed &&
      settings.privacyReviewed &&
      [
        settings.name,
        settings.owner,
        settings.email,
        settings.street,
        settings.postcode,
        settings.city,
        settings.country,
        settings.databaseProvider,
        settings.databaseRegion,
        settings.logRetention,
        settings.mailProvider,
        settings.transfers,
      ].every((value) => value?.trim()),
  );
}

export function contactEnabled(settings: Partial<WebsiteSetting>) {
  return (
    legalReady(settings) &&
    hasCaptchaConfig() &&
    process.env.CONTACT_ENABLED === "true" &&
    [
      "SMTP_HOST",
      "SMTP_USER",
      "SMTP_PASSWORD",
      "SMTP_FROM",
      "DATABASE_URL",
      "PAYLOAD_SECRET",
    ].every((key) => Boolean(process.env[key]))
  );
}
