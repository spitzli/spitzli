import { getSiteSettings } from "../src/lib/site-settings";

if (process.env.VERCEL_ENV === "production" || process.argv.includes("--production")) {
  if (!(await getSiteSettings()).legalReady)
    throw new Error("Website-Einstellungen im CMS vervollständigen und freigeben.");
  console.log("Website-Einstellungen im CMS vollständig und freigegeben.");
}
