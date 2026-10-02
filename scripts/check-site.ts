import { getPayload } from "payload";
import config from "../payload.config";
import { legalReady } from "../src/lib/site";

if (process.env.VERCEL_ENV === "production" || process.argv.includes("--production")) {
  const payload = await getPayload({ config });
  try {
    const settings = await payload.findGlobal({ slug: "website-settings", overrideAccess: true });
    if (!legalReady(settings))
      throw new Error(
        "Website-Einstellungen: Firmen-/Kontaktdaten, Datenschutzangaben und Freigaben im CMS vervollständigen.",
      );
    console.log("Website-Einstellungen im CMS vollständig und freigegeben.");
  } finally {
    await payload.destroy();
  }
}
process.exit(0);
