import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSiteSettings();
  const legalReady = site.legalReady;
  const production = process.env.VERCEL_ENV === "production" && legalReady;
  return {
    rules: {
      userAgent: "*",
      ...(production ? { allow: "/", disallow: ["/admin", "/api"] } : { disallow: "/" }),
    },
    ...(production ? { sitemap: `${site.url}/sitemap.xml` } : {}),
  };
}
