import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryMessage } from "@/i18n";
import { languageAlternates, localizePath } from "@/i18n/locale";
import { getI18n } from "@/i18n/server";
import { referenceURL } from "@/lib/links";
import { getProject } from "@/lib/projects";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, t } = await getI18n();
  const project = await getProject((await params).slug, locale);
  return project
    ? {
        title: project.name,
        description: project.summary,
        alternates: languageAlternates(`/projekte/${project.slug}`, locale),
        openGraph: {
          title: project.name,
          description: project.summary,
          url: localizePath(`/projekte/${project.slug}`, locale),
          images: ["/og.png"],
        },
        twitter: {
          card: "summary_large_image",
          title: project.name,
          description: project.summary,
          images: ["/og.png"],
        },
      }
    : { title: t("Project not found") };
}
const statuses = {
  development: "In development",
  live: "Live",
  completed: "Completed",
  archived: "Archived",
  unspecified: "",
};
export default async function ProjectPage({ params }: Props) {
  const { locale, t } = await getI18n();
  const project = await getProject((await params).slug, locale);
  if (!project) notFound();
  const image = typeof project.image === "object" ? project.image : null;
  return (
    <main id="main" className="container project-detail">
      <Link className="text-link" href={`${localizePath("/", locale)}#projekte`}>
        ← {t("All projects")}
      </Link>
      <p className="project-category">{t(categoryMessage[project.category] || project.category)}</p>
      <h1>{project.name}</h1>
      <p className="lede">{project.summary}</p>
      <dl className="project-meta">
        {typeof project.client === "object" && project.client && (
          <div>
            <dt>{t("Company")}</dt>
            <dd>{project.client.name}</dd>
          </div>
        )}
        {project.period && (
          <div>
            <dt>{t("Period")}</dt>
            <dd>{project.period}</dd>
          </div>
        )}
        {project.projectStatus && statuses[project.projectStatus] && (
          <div>
            <dt>{t("Status")}</dt>
            <dd>{t(statuses[project.projectStatus])}</dd>
          </div>
        )}
      </dl>
      {image?.url && image.rightsConfirmed && (
        <figure className="detail-image">
          {/* biome-ignore lint/performance/noImgElement: CMS-generated raster derivative */}
          <img
            src={image.sizes?.card?.url || image.url}
            alt={image.alt}
            width={image.sizes?.card?.width || image.width || 1000}
            height={image.sizes?.card?.height || image.height || 625}
          />
        </figure>
      )}
      <div className="project-body">
        <div>
          <h2>{t("My contribution")}</h2>
          {(project.description || project.summary).split(/\n\s*\n/).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {Boolean(project.technologies?.length) && (
            <>
              <h2>{t("Technologies")}</h2>
              <ul className="technology-list">
                {project.technologies?.map((tech) => (
                  <li key={tech.id || tech.name}>{tech.name}</li>
                ))}
              </ul>
            </>
          )}
        </div>
        <aside>
          <h2>{t("Project links")}</h2>
          <ul className="project-links">
            {project.website && (
              <li>
                <a href={referenceURL(project.website)} target="_blank" rel="noopener noreferrer">
                  {t("Website")} <span aria-hidden="true">↗</span>
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
                  {t("Repository")} <span aria-hidden="true">↗</span>
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
            {t("External links open in a new tab. Website links include source parameters (UTM).")}
          </p>
        </aside>
      </div>
      <div className="detail-contact">
        <h2>{t("Working on something similar?")}</h2>
        <Link className="button" href={`${localizePath("/", locale)}#kontakt`}>
          {t("Discuss a project")} <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
