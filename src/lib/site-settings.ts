import config from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";
import { legalNoticeReady, legalReady, site } from "./site";

export const getSiteSettings = cache(async () => {
  const payload = await getPayload({ config });
  const settings = await payload.findGlobal({ slug: "website-settings", overrideAccess: true });
  return {
    ...site,
    ...settings,
    legalNoticeReady: legalNoticeReady(settings),
    legalReady: legalReady(settings),
  };
});
