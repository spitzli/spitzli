import type { Metadata } from "next";
import { languageAlternates } from "@/i18n/locale";
import { getI18n } from "@/i18n/server";
import { legal, legalReady, site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return { title: t("Legal notice"), alternates: languageAlternates("/impressum", locale) };
}
export default async function Impressum() {
  const { t } = await getI18n();
  return (
    <main id="main" className="container legal-page">
      <h1>{t("Legal notice")}</h1>
      {!legalReady && (
        <p className="legal-warning">
          {t(
            "Draft — not yet approved for publication. The final review of the mandatory information and privacy notice is still pending.",
          )}
        </p>
      )}
      <h2>{t("Information under section 5 DDG")}</h2>
      <address>
        <strong>Spitzli Development</strong>
        <br />
        {t("Owner: Dominik Spitzli")}
        <br />
        {t("Sole proprietor")}
        <br />
        {legal.street || t("[Business address to be added]")}
        <br />
        {legal.postcode || "[ZIP]"} {legal.city || t("[City]")}
        <br />
        {legal.country === "Deutschland" ? t("Germany") : legal.country}
      </address>
      <h2>{t("Contact")}</h2>
      <p>
        {t("Email")}: <a href={`mailto:${site.email}`}>{site.email}</a>
        {legal.phone && (
          <>
            <br />
            {t("Phone")}: {legal.phone}
          </>
        )}
      </p>
      {legal.vatID && (
        <>
          <h2>{t("VAT identification number")}</h2>
          <p>
            {t("VAT identification number under section 27a UStG: {number}", {
              number: legal.vatID,
            })}
          </p>
        </>
      )}
      {legal.businessID && (
        <>
          <h2>{t("Business identification number")}</h2>
          <p>{legal.businessID}</p>
        </>
      )}
      {legal.register && (
        <>
          <h2>{t("Register information")}</h2>
          <p>{legal.register}</p>
        </>
      )}
      <h2>{t("Content and project references")}</h2>
      <p>
        {t(
          "Dominik Spitzli is responsible for this website’s content. Project and company names describe my work. Linked websites are operated by their respective providers.",
        )}
      </p>
    </main>
  );
}
