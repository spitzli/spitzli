import { getPayload } from "payload";
import config from "../payload.config";

const payload = await getPayload({ config });
try {
  await payload.db.migrate();
} finally {
  await payload.destroy();
}
// All writes are awaited; stop background workers held by the CMS tooling.
process.exit(0);
