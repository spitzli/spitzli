import config from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";
import { legalReady, site } from "./site";

export const getSiteSettings = cache(async () => {
  const payload = await getPayload({ config });
  const settings = await payload.findGlobal({ slug: "website-settings", overrideAccess: true });
  return { ...site, ...settings, legalReady: legalReady(settings) };
});
