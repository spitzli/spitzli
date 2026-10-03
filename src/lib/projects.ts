import { cache } from "react";
import type { Project } from "../content-types";
import { translator } from "../i18n";
import type { Locale } from "../i18n/locale";
import { getContent } from "./cms";

function presentProject(project: Project, locale: Locale): Project {
  return {
    ...project,
    summary:
      project.summary ||
      translator(locale).t("A description is not yet available in this language."),
    links: project.links?.map((link) => ({
      ...link,
      label: link.label || new URL(link.url).hostname,
    })),
    image:
      typeof project.image === "object" && project.image
        ? { ...project.image, alt: project.image.alt || project.name }
        : project.image,
  };
}

export const getProjects = cache(async (locale: Locale = "en") => {
  const projects = await getContent<Project[]>(`projects?locale=${locale}`);
  return projects.map((project) => presentProject(project, locale));
});

export const getProject = cache(async (slug: string, locale: Locale = "en") => {
  const project = await getContent<Project | null>(
    `projects/${encodeURIComponent(slug)}?locale=${locale}`,
    true,
  );
  return project ? presentProject(project, locale) : null;
});
