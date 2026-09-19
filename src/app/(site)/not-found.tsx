import Link from "next/link";
import { localizePath } from "@/i18n/locale";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { locale, t } = await getI18n();
  return (
    <main id="main" className="container legal-page">
      <h1>{t("No project here.")}</h1>
      <p>{t("This page does not exist, or the project has not been published yet.")}</p>
      <Link className="text-link" href={`${localizePath("/", locale)}#projekte`}>
        {t("Explore my work")} →
      </Link>
    </main>
  );
}
