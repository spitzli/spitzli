export const site = {
  name: "Spitzli Development",
  owner: "Dominik Spitzli",
  url:
    process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.SITE_URL || "http://localhost:3000",
  email: process.env.CONTACT_EMAIL || "dominik@spitzli.dev",
  github: "https://github.com/NewtTheWolf",
  companyGithub: "https://github.com/spitzli",
  description:
    "Ich entwickle Webanwendungen, APIs und Cloud-Infrastruktur. Dominik Spitzli — selbstständiger Softwareentwickler und Systemarchitekt.",
};

export const legal = {
  street: process.env.LEGAL_STREET,
  postcode: process.env.LEGAL_POSTCODE,
  city: process.env.LEGAL_CITY,
  country: process.env.LEGAL_COUNTRY || "Deutschland",
  phone: process.env.LEGAL_PHONE,
  vatID: process.env.LEGAL_VAT_ID,
  businessID: process.env.LEGAL_BUSINESS_ID,
  register: process.env.LEGAL_REGISTER,
};

export const legalReady = Boolean(
  legal.street &&
    legal.postcode &&
    legal.city &&
    process.env.LEGAL_REVIEWED === "true" &&
    process.env.PRIVACY_REVIEWED === "true" &&
    process.env.PRIVACY_DATABASE_PROVIDER &&
    process.env.PRIVACY_DATABASE_REGION &&
    process.env.PRIVACY_LOG_RETENTION &&
    process.env.PRIVACY_MAIL_PROVIDER &&
    process.env.PRIVACY_TRANSFERS,
);

export function contactEnabled() {
  return (
    legalReady &&
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
