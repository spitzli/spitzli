import {
  type Access,
  APIError,
  type CollectionConfig,
  type PayloadRequest,
  type TextField,
} from "payload";
import { isPublicURL } from "../lib/links";

const admin = ({ req }: { req: PayloadRequest }): boolean => Boolean(req.user);
const published: Access = ({ req }) => (req.user ? true : { _status: { equals: "published" } });
const managed = { create: admin, update: admin, delete: admin };
const urlField = (name: string, label: string): TextField => ({
  name,
  label,
  type: "text",
  validate: (value: unknown) =>
    !value || isPublicURL(value) || "Bitte eine öffentliche HTTPS-URL ohne Zugangsdaten angeben.",
});

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Administrator", plural: "Administratoren" },
  admin: { useAsTitle: "email" },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 2 * 60 * 60,
    cookies: { secure: process.env.SITE_URL?.startsWith("https://"), sameSite: "Lax" },
  },
  access: { ...managed, read: admin, admin },
  hooks: {
    beforeOperation: [
      ({ operation, req }) => {
        // Also blocks Payload's public create-first-user endpoint on an empty database.
        if (operation === "create" && !req.user && req.context.bootstrap !== true) {
          throw new APIError("Administratoren werden ausschließlich intern angelegt.", 403);
        }
      },
    ],
  },
  fields: [{ name: "name", type: "text", required: true }],
};

export const Clients: CollectionConfig = {
  slug: "clients",
  labels: { singular: "Kunde / Unternehmen", plural: "Kunden / Unternehmen" },
  admin: { useAsTitle: "name", defaultColumns: ["name", "website"] },
  access: { ...managed, read: admin },
  fields: [
    { name: "name", type: "text", required: true, unique: true, maxLength: 100 },
    urlField("website", "Website"),
  ],
};

export const Projects: CollectionConfig = {
  slug: "projects",
  labels: { singular: "Projekt", plural: "Projekte" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "client", "category", "_status", "sortOrder"],
  },
  access: { ...managed, read: published },
  versions: { drafts: true, maxPerDoc: 10 },
  defaultSort: "sortOrder",
  fields: [
    { name: "name", label: "Name", type: "text", required: true, maxLength: 100 },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      validate: (value: unknown) =>
        (typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) ||
        "Nur Kleinbuchstaben, Ziffern und Bindestriche.",
    },
    { name: "client", label: "Kunde / Unternehmen", type: "relationship", relationTo: "clients" },
    {
      name: "summary",
      label: "Kurzbeschreibung",
      type: "textarea",
      required: true,
      maxLength: 300,
    },
    {
      name: "description",
      label: "Ausführliche Beschreibung",
      type: "textarea",
      maxLength: 12000,
      admin: { description: "Absätze mit Leerzeile trennen. Keine HTML-Eingabe." },
    },
    { name: "image", label: "Freigegebenes Logo / Bild", type: "upload", relationTo: "media" },
    {
      name: "category",
      label: "Kategorie",
      type: "select",
      required: true,
      options: [
        "Webentwicklung",
        "Webapps",
        "APIs & Plattformen",
        "Cloud & Infrastruktur",
        "Developer Experience",
        "Open Source",
      ],
    },
    {
      name: "technologies",
      label: "Technologien",
      type: "array",
      maxRows: 16,
      fields: [{ name: "name", type: "text", required: true, maxLength: 40 }],
    },
    urlField("website", "Projekt-URL"),
    urlField("repository", "Öffentliches Repository"),
    {
      name: "links",
      label: "Weitere Links",
      type: "array",
      maxRows: 16,
      fields: [
        { name: "label", label: "Bezeichnung", type: "text", required: true, maxLength: 48 },
        { ...urlField("url", "URL"), required: true },
      ],
    },
    {
      name: "period",
      label: "Zeitraum",
      type: "text",
      maxLength: 60,
      admin: { description: "Optional; nur bestätigte Zeiträume angeben." },
    },
    {
      name: "projectStatus",
      label: "Projektstatus",
      type: "select",
      options: [
        { label: "Nicht anzeigen", value: "unspecified" },
        { label: "In Entwicklung", value: "development" },
        { label: "Live", value: "live" },
        { label: "Abgeschlossen", value: "completed" },
        { label: "Archiviert", value: "archived" },
      ],
      defaultValue: "unspecified",
    },
    { name: "featured", label: "Hervorheben", type: "checkbox", defaultValue: false },
    { name: "sortOrder", label: "Sortierung", type: "number", defaultValue: 10, required: true },
  ],
};

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Bild", plural: "Bilder" },
  access: { ...managed, read: () => true },
  upload: {
    staticDir: "media",
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    imageSizes: [
      { name: "card", width: 1000, height: 625, fit: "inside", withoutEnlargement: true },
    ],
    adminThumbnail: "card",
  },
  fields: [
    { name: "alt", label: "Alternativtext", type: "text", required: true, maxLength: 240 },
    {
      name: "rightsConfirmed",
      label: "Ich darf dieses Bild / Logo öffentlich verwenden.",
      type: "checkbox",
      required: true,
      validate: (value: unknown) =>
        value === true || "Vor dem Upload muss die Nutzungsfreigabe vorliegen.",
      admin: {
        description:
          "Bilder werden öffentlich gespeichert. Keine vertraulichen Dateien oder ungeklärten Kundenlogos hochladen.",
      },
    },
  ],
};

export const ContactLimits: CollectionConfig = {
  slug: "contact-limits",
  dbName: "contact_limits",
  admin: { hidden: true },
  access: { create: () => false, read: () => false, update: () => false, delete: () => false },
  fields: [
    { name: "key", type: "text", required: true, unique: true },
    { name: "hits", type: "number", required: true },
    { name: "expiresAt", type: "date", required: true, index: true },
  ],
};
