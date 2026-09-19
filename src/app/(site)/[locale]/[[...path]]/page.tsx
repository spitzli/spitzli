import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { internalPath, isLocale } from "@/i18n/locale";
import Datenschutz, { generateMetadata as privacyMetadata } from "../../datenschutz/page";
import Impressum, { generateMetadata as legalMetadata } from "../../impressum/page";
import Home, { generateMetadata as homeMetadata } from "../../page";
import ProjectPage, { generateMetadata as projectMetadata } from "../../projekte/[slug]/page";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string; path?: string[] }> };
async function route(params: Props["params"]) {
  const { locale, path = [] } = await params;
  if (!isLocale(locale)) notFound();
  const canonical = internalPath(`/${path.join("/")}`);
  const match = /^\/projekte\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(canonical);
  return { canonical, slug: match?.[1] };
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { canonical, slug } = await route(params);
  if (canonical === "/") return homeMetadata();
  if (canonical === "/impressum") return legalMetadata();
  if (canonical === "/datenschutz") return privacyMetadata();
  if (slug) return projectMetadata({ params: Promise.resolve({ slug }) });
  return {};
}
export default async function LocalizedPage({ params }: Props) {
  const { canonical, slug } = await route(params);
  if (canonical === "/") return <Home />;
  if (canonical === "/impressum") return <Impressum />;
  if (canonical === "/datenschutz") return <Datenschutz />;
  if (slug) return <ProjectPage params={Promise.resolve({ slug })} />;
  notFound();
}
