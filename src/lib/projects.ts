import config from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";
import { translator } from "../i18n";
import type { Locale } from "../i18n/locale";
import type { Project } from "../payload-types";

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
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "projects",
    locale,
    fallbackLocale: "en",
    // Resolve client names only through published projects; the client directory stays private.
    overrideAccess: true,
    depth: 1,
    where: { _status: { equals: "published" } },
    sort: ["sortOrder", "name"],
    pagination: false,
  });
  return result.docs.map((project) => presentProject(project, locale));
});

export const getProject = cache(async (slug: string, locale: Locale = "en") => {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "projects",
    locale,
    fallbackLocale: "en",
    overrideAccess: true,
    depth: 1,
    limit: 1,
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }] },
  });
  return result.docs[0] ? presentProject(result.docs[0], locale) : null;
});
