import { getSiteSettings } from "../src/lib/site-settings";

if (process.env.VERCEL_ENV === "production" || process.argv.includes("--production")) {
  if (!(await getSiteSettings()).legalReady)
    throw new Error("Website-Einstellungen im zentralen CMS vervollständigen und freigeben.");
  console.log("Website-Einstellungen im zentralen CMS vollständig und freigegeben.");
}
