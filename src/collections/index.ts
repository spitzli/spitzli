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
    !value || isPublicURL(value) || "Enter a public HTTPS URL without credentials.",
});

export const Users: CollectionConfig = {
  versions: false,
  slug: "users",
  labels: { singular: "Administrator", plural: "Administrators" },
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
          throw new APIError("Administrators can only be created internally.", 403);
        }
      },
    ],
  },
  fields: [{ name: "name", type: "text", required: true }],
};

export const Clients: CollectionConfig = {
  versions: false,
  slug: "clients",
  labels: { singular: "Client / company", plural: "Clients / companies" },
  admin: { useAsTitle: "name", defaultColumns: ["name", "website"] },
  access: { ...managed, read: admin },
  fields: [
    { name: "name", type: "text", required: true, unique: true, maxLength: 100 },
    urlField("website", "Website"),
  ],
};

export const Projects: CollectionConfig = {
  slug: "projects",
  labels: { singular: "Project", plural: "Projects" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "client", "category", "_status", "sortOrder"],
  },
  access: { ...managed, read: published, readVersions: admin },
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
        "Use lowercase letters, numbers and hyphens only.",
    },
    { name: "client", label: "Client / company", type: "relationship", relationTo: "clients" },
    {
      name: "summary",
      label: "Summary",
      type: "textarea",
      localized: true,
      required: true,
      maxLength: 300,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      localized: true,
      maxLength: 12000,
      admin: { description: "Separate paragraphs with a blank line. Do not enter HTML." },
    },
    { name: "image", label: "Approved logo / image", type: "upload", relationTo: "media" },
    {
      name: "category",
      label: "Category",
      type: "select",
      required: true,
      options: [
        { label: "Web development", value: "Webentwicklung" },
        { label: "Web apps", value: "Webapps" },
        { label: "APIs & platforms", value: "APIs & Plattformen" },
        { label: "Cloud & infrastructure", value: "Cloud & Infrastruktur" },
        "Developer Experience",
        "Open Source",
      ],
    },
    {
      name: "technologies",
      label: "Technologies",
      type: "array",
      maxRows: 16,
      fields: [{ name: "name", type: "text", required: true, maxLength: 40 }],
    },
    urlField("website", "Project URL"),
    urlField("repository", "Public repository"),
    {
      name: "links",
      label: "Additional links",
      type: "array",
      maxRows: 16,
      fields: [
        {
          name: "label",
          label: "Label",
          type: "text",
          required: true,
          maxLength: 48,
          localized: true,
        },
        { ...urlField("url", "URL"), required: true },
      ],
    },
    {
      name: "period",
      label: "Period",
      type: "text",
      maxLength: 60,
      admin: { description: "Optional; enter confirmed dates only." },
    },
    {
      name: "projectStatus",
      label: "Project status",
      type: "select",
      options: [
        { label: "Do not display", value: "unspecified" },
        { label: "In development", value: "development" },
        { label: "Live", value: "live" },
        { label: "Completed", value: "completed" },
        { label: "Archived", value: "archived" },
      ],
      defaultValue: "unspecified",
    },
    { name: "featured", label: "Featured", type: "checkbox", defaultValue: false },
    { name: "sortOrder", label: "Sort order", type: "number", defaultValue: 10, required: true },
  ],
};

export const Media: CollectionConfig = {
  versions: false,
  slug: "media",
  labels: { singular: "Image", plural: "Images" },
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
    {
      name: "alt",
      label: "Alternative text",
      type: "text",
      required: true,
      maxLength: 240,
      localized: true,
    },
    {
      name: "rightsConfirmed",
      label: "I have permission to publish this image / logo.",
      type: "checkbox",
      required: true,
      validate: (value: unknown) =>
        value === true || "Confirm permission to publish before uploading.",
      admin: {
        description:
          "Images are stored publicly. Do not upload confidential files or client logos without permission.",
      },
    },
  ],
};

export const ContactLimits: CollectionConfig = {
  versions: false,
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
