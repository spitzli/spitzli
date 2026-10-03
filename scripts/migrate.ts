import { getPayload } from "payload";

process.env.DATABASE_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const { default: config } = await import("../payload.config");

const payload = await getPayload({ config });
try {
  await payload.db.migrate();
} finally {
  await payload.destroy();
}
// All writes are awaited; stop background workers held by the CMS tooling.
process.exit(0);
