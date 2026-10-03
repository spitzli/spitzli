import { cache } from "react";
import type { WebsiteSetting } from "../content-types";
import { getContent } from "./cms";
import { legalReady, site } from "./site";

export const getSiteSettings = cache(async () => {
  const settings = await getContent<WebsiteSetting>("settings");
  return { ...site, ...settings, legalReady: legalReady(settings) };
});
