import type { MetadataRoute } from "next";
import { legalReady, site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const production = process.env.VERCEL_ENV === "production" && legalReady;
  return {
    rules: {
      userAgent: "*",
      ...(production ? { allow: "/", disallow: ["/admin", "/api"] } : { disallow: "/" }),
    },
    ...(production ? { sitemap: `${site.url}/sitemap.xml` } : {}),
  };
}
