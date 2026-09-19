"use client";

import Link from "next/link";
import { useState } from "react";
import { referenceURL } from "@/lib/links";
import type { Project } from "@/payload-types";

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const [category, setCategory] = useState("Alle Bereiche");
  const [client, setClient] = useState("Alle Unternehmen");
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
      (category === "Alle Bereiche" || project.category === category) &&
      (client === "Alle Unternehmen" ||
        (typeof project.client === "object" && project.client?.name === client)),
  );

  return (
    <>
      <div className="project-filters">
        <div className="filter-field">
          <label htmlFor="category-filter">Bereich</label>
          <select
            id="category-filter"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option>Alle Bereiche</option>
            {categories.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="client-filter">Unternehmen</label>
          <select
            id="client-filter"
            value={client}
            onChange={(event) => setClient(event.target.value)}
          >
            <option>Alle Unternehmen</option>
            {clients.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <p className="result-count" aria-live="polite">
          {visible.length} {visible.length === 1 ? "Projekt" : "Projekte"}
        </p>
      </div>
      <div className="project-grid">
        {visible.map((project) => {
          const image = typeof project.image === "object" ? project.image : null;
          return (
            <article
              className={`project-card${project.featured ? " featured" : ""}`}
              key={project.id}
            >
              {image?.url && image.rightsConfirmed && (
                <figure className="project-image">
                  {/* biome-ignore lint/performance/noImgElement: Payload generates the card-sized raster derivative on upload */}
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
                <p className="project-category">{project.category}</p>
                <h3>
                  <Link href={`/projekte/${project.slug}`}>{project.name}</Link>
                </h3>
                <p>{project.summary}</p>
                {project.technologies && project.technologies.length > 0 && (
                  <ul className="technology-list">
                    {project.technologies.map((tech) => (
                      <li key={tech.id || tech.name}>{tech.name}</li>
                    ))}
                  </ul>
                )}
                <div className="project-actions">
                  <Link className="text-link" href={`/projekte/${project.slug}`}>
                    Zum Projekt <span aria-hidden="true">↗</span>
                  </Link>
                  {project.website && (
                    <a
                      className="quiet-link"
                      href={referenceURL(project.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.name}: Website öffnen (neuer Tab)`}
                    >
                      Website <span aria-hidden="true">↗</span>
                    </a>
                  )}
                  {project.repository && (
                    <a
                      className="quiet-link"
                      href={referenceURL(project.repository)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Repository <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <div className="empty-state">
          <p>Für diese Auswahl sind noch keine Projekte veröffentlicht.</p>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setCategory("Alle Bereiche");
              setClient("Alle Unternehmen");
            }}
          >
            Alle Projekte zeigen
          </button>
        </div>
      )}
    </>
  );
}
