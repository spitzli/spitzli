"use client";
import Link from "next/link";
import { useState } from "react";
import { categoryMessage } from "@/i18n";
import { useI18n } from "@/i18n/client";
import { localizePath } from "@/i18n/locale";
import { referenceURL } from "@/lib/links";
import type { Project } from "@/payload-types";

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const { locale, t, ngettext } = useI18n();
  const [category, setCategory] = useState("");
  const [client, setClient] = useState("");
  const categories = [...new Set(projects.map((project) => project.category))];
  const clients = [
    ...new Set(
      projects.flatMap((project) =>
        typeof project.client === "object" && project.client ? [project.client.name] : [],
      ),
    ),
  ];
  const visible = projects.filter(
    (project) =>
      (!category || project.category === category) &&
      (!client || (typeof project.client === "object" && project.client?.name === client)),
  );
  return (
    <>
      <div className="project-filters">
        <div className="filter-field">
          <label htmlFor="category-filter">{t("Discipline")}</label>
          <select
            id="category-filter"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">{t("All disciplines")}</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {t(categoryMessage[value] || value)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="client-filter">{t("Company")}</label>
          <select
            id="client-filter"
            value={client}
            onChange={(event) => setClient(event.target.value)}
          >
            <option value="">{t("All companies")}</option>
            {clients.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <p className="result-count" aria-live="polite">
          {ngettext("{count} project", "{count} projects", visible.length)}
        </p>
      </div>
      <div className="project-grid">
        {visible.map((project) => {
          const image = typeof project.image === "object" ? project.image : null;
          const href = localizePath(`/projekte/${project.slug}`, locale);
          return (
            <article
              key={project.id}
              className={`project-card${project.featured ? " featured" : ""}`}
            >
              {image?.url && image.rightsConfirmed && (
                <figure className="project-image">
                  {/* biome-ignore lint/performance/noImgElement: Payload generates the raster derivative */}
                  <img
                    src={image.sizes?.card?.url || image.url}
                    alt={image.alt}
                    width={image.sizes?.card?.width || image.width || 1000}
                    height={image.sizes?.card?.height || image.height || 625}
                    loading="lazy"
                  />
                </figure>
              )}
              <div className="project-card-content">
                <div className="project-heading">
                  <p className="project-category">
                    {t(categoryMessage[project.category] || project.category)}
                  </p>
                  <h3>
                    <Link href={href}>{project.name}</Link>
                  </h3>
                  {project.period && <p className="small-copy">{project.period}</p>}
                </div>
                <div className="project-summary">
                  <p>{project.summary}</p>
                  {Boolean(project.technologies?.length) && (
                    <ul className="technology-list">
                      {project.technologies?.map((tech) => (
                        <li key={tech.id || tech.name}>{tech.name}</li>
                      ))}
                    </ul>
                  )}
                  <div className="project-actions">
                    <Link className="text-link" href={href}>
                      {t("View project")} <span aria-hidden="true">↗</span>
                    </Link>
                    {project.website && (
                      <a
                        className="quiet-link"
                        href={referenceURL(project.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t("{project}: open website in a new tab", {
                          project: project.name,
                        })}
                      >
                        {t("Website")} <span aria-hidden="true">↗</span>
                      </a>
                    )}
                    {project.repository && (
                      <a
                        className="quiet-link"
                        href={referenceURL(project.repository)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("Repository")} <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <div className="empty-state">
          <p>{t("No projects have been published for this selection yet.")}</p>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setCategory("");
              setClient("");
            }}
          >
            {t("Show all projects")}
          </button>
        </div>
      )}
    </>
  );
}
