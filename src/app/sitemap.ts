import type { MetadataRoute } from "next";
import { locales, localizePath } from "@/i18n/locale";
import { getProjects } from "@/lib/projects";
import { legalReady, site } from "@/lib/site";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!legalReady || process.env.VERCEL_ENV !== "production") return [];
  const projects = await getProjects("en");
  return locales.flatMap((locale) => [
    ...["/", "/impressum", "/datenschutz"].map((path) => ({
      url: `${site.url}${localizePath(path, locale)}`,
      alternates: {
        languages: {
          en: `${site.url}${localizePath(path, "en")}`,
          de: `${site.url}${localizePath(path, "de")}`,
        },
      },
    })),
    ...projects.map((project) => ({
      url: `${site.url}${localizePath(`/projekte/${project.slug}`, locale)}`,
      lastModified: project.updatedAt,
      alternates: {
        languages: {
          en: `${site.url}${localizePath(`/projekte/${project.slug}`, "en")}`,
          de: `${site.url}${localizePath(`/projekte/${project.slug}`, "de")}`,
        },
      },
    })),
  ]);
}
