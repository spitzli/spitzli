import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/ProjectDetail";
import { languageAlternates, localizePath } from "@/i18n/locale";
import { getI18n } from "@/i18n/server";
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
export default async function ProjectPage({ params }: Props) {
  const { locale } = await getI18n();
  const project = await getProject((await params).slug, locale);
  if (!project) notFound();
  return <ProjectDetail project={project} locale={locale} />;
}
