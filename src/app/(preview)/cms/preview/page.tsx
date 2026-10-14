import config from "@payload-config";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";
import { ProjectDetail } from "@/components/ProjectDetail";
import { isLocale } from "@/i18n/locale";
import { presentProject } from "@/lib/projects";
import { cmsUser } from "@/webdock-cms/server";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const payload = await getPayload({ config });
  const user = await cmsUser(payload, await headers());
  if (!user) redirect("/api/sso/login?returnTo=/cms");
  const query = await searchParams;
  if (query.module !== "projects" || typeof query.id !== "string" || !/^\d+$/.test(query.id))
    notFound();
  const locale = isLocale(query.locale) ? query.locale : "en";
  const project = await payload.findByID({
    collection: "projects",
    id: query.id,
    locale,
    fallbackLocale: "en",
    draft: true,
    depth: 1,
    overrideAccess: false,
    user,
    disableErrors: true,
  });
  if (!project) notFound();
  return (
    <div lang={locale}>
      <aside className="preview-notice container">
        Saved draft preview — unsaved changes are not included. <Link href="/cms">Back to CMS</Link>
      </aside>
      <ProjectDetail project={presentProject(project, locale)} locale={locale} />
    </div>
  );
}
