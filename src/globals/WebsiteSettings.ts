import type { GlobalConfig } from "payload";

export const WebsiteSettings: GlobalConfig = {
  slug: "website-settings",
  label: "Website-Einstellungen",
  versions: false,
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "name",
      label: "Firmenname",
      type: "text",
      required: true,
      defaultValue: "Spitzli Development",
    },
    {
      name: "owner",
      label: "Inhaber",
      type: "text",
      required: true,
      defaultValue: "Dominik Spitzli",
    },
    {
      name: "email",
      label: "Öffentliche Kontaktadresse / Formularempfänger",
      type: "email",
      required: true,
      defaultValue: "info@spitzli.dev",
    },
    { name: "street", label: "Straße und Hausnummer", type: "text", required: true },
    { name: "postcode", label: "Postleitzahl", type: "text", required: true },
    { name: "city", label: "Ort", type: "text", required: true },
    { name: "country", label: "Land", type: "text", required: true, defaultValue: "Deutschland" },
    { name: "phone", label: "Telefon", type: "text" },
    { name: "vatID", label: "USt-IdNr.", type: "text" },
    { name: "businessID", label: "Wirtschafts-Identifikationsnummer", type: "text" },
    { name: "register", label: "Registerangaben", type: "text" },
    { name: "databaseProvider", label: "Datenbankanbieter", type: "text" },
    { name: "databaseRegion", label: "Datenbankregion", type: "text" },
    { name: "logRetention", label: "Aufbewahrungsdauer der Logs", type: "text" },
    { name: "mailProvider", label: "E-Mail-Postfachanbieter", type: "text" },
    { name: "transfers", label: "Garantien bei Drittlandübermittlungen", type: "textarea" },
    {
      name: "legalReviewed",
      label: "Impressum geprüft und freigegeben",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "privacyReviewed",
      label: "Datenschutzhinweise geprüft und freigegeben",
      type: "checkbox",
      defaultValue: false,
    },
  ],
};
