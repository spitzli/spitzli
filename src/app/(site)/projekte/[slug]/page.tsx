import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { referenceURL } from "@/lib/links";
import { getProject } from "@/lib/projects";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProject((await params).slug);
  return project
    ? {
        title: project.name,
        description: project.summary,
        alternates: { canonical: `/projekte/${project.slug}` },
        openGraph: {
          title: project.name,
          description: project.summary,
          url: `/projekte/${project.slug}`,
          images: ["/og.png"],
        },
        twitter: {
          card: "summary_large_image",
          title: project.name,
          description: project.summary,
          images: ["/og.png"],
        },
      }
    : { title: "Projekt nicht gefunden" };
}

const statuses = {
  development: "In Entwicklung",
  live: "Live",
  completed: "Abgeschlossen",
  archived: "Archiviert",
  unspecified: "",
};

export default async function ProjectPage({ params }: Props) {
  const project = await getProject((await params).slug);
  if (!project) notFound();
  const image = typeof project.image === "object" ? project.image : null;
  return (
    <main id="main" className="container project-detail">
      <Link className="text-link" href="/#projekte">
        ← Alle Projekte
      </Link>
      <p className="project-category">{project.category}</p>
      <h1>{project.name}</h1>
      <p className="lede">{project.summary}</p>
      <dl className="project-meta">
        {typeof project.client === "object" && project.client && (
          <div>
            <dt>Unternehmen</dt>
            <dd>{project.client.name}</dd>
          </div>
        )}
        {project.period && (
          <div>
            <dt>Zeitraum</dt>
            <dd>{project.period}</dd>
          </div>
        )}
        {project.projectStatus && statuses[project.projectStatus] && (
          <div>
            <dt>Status</dt>
            <dd>{statuses[project.projectStatus]}</dd>
          </div>
        )}
      </dl>
      {image?.url && image.rightsConfirmed && (
        <figure className="detail-image">
          {/* biome-ignore lint/performance/noImgElement: use the CMS derivative; no arbitrary remote image optimizer */}
          <img
            src={image.sizes?.card?.url || image.url}
            alt={image.alt}
            width={image.width || 1000}
            height={image.height || 625}
          />
        </figure>
      )}
      <div className="project-body">
        <div>
          <h2>Meine Arbeit</h2>
          {(project.description || project.summary).split(/\n\s*\n/).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {Boolean(project.technologies?.length) && (
            <>
              <h2>Technologien</h2>
              <ul className="technology-list">
                {project.technologies?.map((technology) => (
                  <li key={technology.id || technology.name}>{technology.name}</li>
                ))}
              </ul>
            </>
          )}
        </div>
        <aside>
          <h2>Links zum Projekt</h2>
          <ul className="project-links">
            {project.website && (
              <li>
                <a href={referenceURL(project.website)} target="_blank" rel="noopener noreferrer">
                  Website <span aria-hidden="true">↗</span>
                </a>
              </li>
            )}
            {project.repository && (
              <li>
                <a
                  href={referenceURL(project.repository)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Repository <span aria-hidden="true">↗</span>
                </a>
              </li>
            )}
            {project.links?.map((link) => (
              <li key={link.id || link.url}>
                <a href={referenceURL(link.url)} target="_blank" rel="noopener noreferrer">
                  {link.label} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="small-copy">
            Externe Links öffnen in einem neuen Tab. Website-Links enthalten Herkunftsparameter
            (UTM).
          </p>
        </aside>
      </div>
      <div className="detail-contact">
        <h2>Eine ähnliche Aufgabe?</h2>
        <Link className="button" href="/#kontakt">
          Projekt anfragen <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
