import { getPayload } from "payload";
import config from "../payload.config";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 16)
  throw new Error("ADMIN_EMAIL und ADMIN_PASSWORD (mindestens 16 Zeichen) setzen.");
const payload = await getPayload({ config });
try {
  const existing = await payload.count({ collection: "users", overrideAccess: true });
  if (existing.totalDocs !== 0)
    throw new Error("Bootstrap abgebrochen: Es existiert bereits ein Administrator.");
  await payload.create({
    collection: "users",
    overrideAccess: true,
    context: { bootstrap: true },
    data: { email, password, name: "Dominik Spitzli" },
  });
  console.log("Administrator angelegt. ADMIN_PASSWORD jetzt aus der Umgebung entfernen.");
} finally {
  await payload.destroy();
}
process.exit(0);
