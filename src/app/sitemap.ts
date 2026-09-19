import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/projects";
import { legalReady, site } from "@/lib/site";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!legalReady || process.env.VERCEL_ENV !== "production") return [];
  const projects = await getProjects();
  return [
    ...["", "/impressum", "/datenschutz"].map((path) => ({ url: `${site.url}${path}` })),
    ...projects.map((project) => ({
      url: `${site.url}/projekte/${project.slug}`,
      lastModified: project.updatedAt,
    })),
  ];
}
