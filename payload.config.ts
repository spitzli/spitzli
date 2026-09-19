import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Clients, ContactLimits, Media, Projects, Users } from "./src/collections";
import { site } from "./src/lib/site";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const origin = site.url;
const smtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

export default buildConfig({
  serverURL: origin,
  secret: process.env.PAYLOAD_SECRET || "",
  admin: {
    user: "users",
    importMap: { baseDir: dirname },
    meta: { titleSuffix: "— Spitzli Development" },
  },
  localization: {
    locales: [
      { label: "English", code: "en" },
      { label: "Deutsch", code: "de" },
    ],
    defaultLocale: "en",
    fallback: true,
  },
  collections: [Users, Clients, Projects, Media, ContactLimits],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      max: 3,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
    },
    push: false,
    migrationDir: path.resolve(dirname, "src/migrations"),
  }),
  ...(smtp
    ? {
        email: nodemailerAdapter({
          defaultFromAddress: process.env.SMTP_FROM || site.email,
          defaultFromName: "Spitzli Development",
          skipVerify: true,
          transportOptions: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_PORT === "465",
            requireTLS: process.env.SMTP_PORT !== "465",
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
            disableFileAccess: true,
            disableUrlAccess: true,
          },
        }),
      }
    : {}),
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      // Keep migration fields identical with local storage and Vercel Blob.
      alwaysInsertFields: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      // Payload keeps originals and resized filenames in sync; Blob suffixes break that mapping.
      addRandomSuffix: false,
      // All uploads require public-use permission and already live in a public Blob store.
      collections: { media: { disablePayloadAccessControl: true } },
    }),
  ],
  sharp,
  upload: { limits: { fileSize: 3 * 1024 * 1024 }, abortOnLimit: true },
  graphQL: { disable: true },
  csrf: [origin],
  cors: [origin],
  maxDepth: 2,
  typescript: { outputFile: path.resolve(dirname, "src/payload-types.ts") },
});
