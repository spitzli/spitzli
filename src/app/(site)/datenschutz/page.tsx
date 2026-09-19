import type { Metadata } from "next";
import Link from "next/link";
import { languageAlternates, localizePath } from "@/i18n/locale";
import { getI18n } from "@/i18n/server";
import { legal, legalReady, site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return { title: t("Privacy"), alternates: languageAlternates("/datenschutz", locale) };
}
export default async function Datenschutz() {
  const { locale, t } = await getI18n();
  return (
    <main id="main" className="container legal-page">
      <h1>{t("Privacy policy")}</h1>
      {!legalReady && (
        <p className="legal-warning">
          {t(
            "Draft for the planned Vercel deployment. Address, providers, data processing agreements, retention periods and international transfers must be reviewed before publication.",
          )}
        </p>
      )}
      <h2>{t("1. Controller")}</h2>
      <p>
        Dominik Spitzli, Spitzli Development
        <br />
        {legal.street || t("[Business address to be added]")}
        <br />
        {legal.postcode || "[ZIP]"} {legal.city || t("[City]")},{" "}
        {legal.country === "Deutschland" ? t("Germany") : legal.country}
        <br />
        {t("Email")}: <a href={`mailto:${site.email}`}>{site.email}</a>
      </p>
      <p>
        <Link href={localizePath("/impressum", locale)}>{t("Full legal notice")}</Link>
      </p>
      <h2>{t("2. Website hosting")}</h2>
      <p>
        {t(
          "This website is hosted on Vercel. Requests involve technically necessary data, including IP address, time, requested URL, browser/device information and technical error data. Processing serves delivery, stability and security under Article 6(1)(f) GDPR.",
        )}
      </p>
      <p>
        {t("Hosting and image storage: Vercel Inc. (Vercel and Vercel Blob).")}{" "}
        <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
          {t("Vercel privacy policy")}
        </a>
      </p>
      <p>
        {t("Hosting log retention: {retention}", {
          retention: process.env.PRIVACY_LOG_RETENTION || t("[To be confirmed before publication]"),
        })}
      </p>
      <p>
        {t(
          "CMS database: {provider}. Region: {region}. The database stores project content, administration data and the abuse-prevention counters described below, not contact messages.",
          {
            provider: process.env.PRIVACY_DATABASE_PROVIDER || t("[Provider to be added]"),
            region: process.env.PRIVACY_DATABASE_REGION || t("[Region to be added]"),
          },
        )}
      </p>
      <h2>{t("3. Contact by email and form")}</h2>
      <p>
        {t(
          "When you contact me, I process your name, email address and message to handle your enquiry. The legal basis is Article 6(1)(b) GDPR for contractual or pre-contractual enquiries and Article 6(1)(f) GDPR for other enquiries. Please do not send particularly sensitive data through the form.",
        )}
      </p>
      <p>
        {t(
          "The form uses turboSMTP for delivery. Messages are received and handled in my mailbox with {provider}. Enquiries are not stored in the CMS. Emails are retained for as long as processing or statutory retention requirements demand, then deleted.",
          { provider: process.env.PRIVACY_MAIL_PROVIDER || t("[Mailbox provider to be added]") },
        )}
      </p>
      <h2>{t("4. Abuse prevention")}</h2>
      <p>
        {t(
          "The form uses a hidden check field (honeypot) and a limit of five requests per 15 minutes. A keyed hash of the IP address is stored with a counter and expiry time. The IP address itself is not stored in the CMS database for this purpose. Expired counters are deleted on the next form request. Hosting logs are separate.",
        )}
      </p>
      <p>
        {t(
          "The legal basis is Article 6(1)(f) GDPR. My legitimate interest is protecting the form and mail delivery from spam and overload. No external CAPTCHA provider is used.",
        )}
      </p>
      <h2>{t("5. Cookies, fonts and administration")}</h2>
      <p>
        {t(
          "The public website uses no analytics or marketing cookies and no visitor tracking. Fonts are served locally, not fetched from Google Fonts. Images may be loaded from Vercel Blob.",
        )}
      </p>
      <p>
        {t(
          "The initial language follows your browser preferences, with English as the fallback. When you explicitly choose a language, the technically necessary spitzli_locale cookie remembers that choice for one year. It contains only en or de, no visitor identifier. Storage is based on section 25(2)(2) TDDDG; processing serves the requested language setting under Article 6(1)(f) GDPR.",
        )}
      </p>
      <p>
        {t(
          "Signing into the protected CMS uses a technically necessary session cookie lasting up to two hours. Administrator accounts and login information are processed for secure site management. Storage is based on section 25(2)(2) TDDDG and processing on the legitimate interest in secure administration under Article 6(1)(f) GDPR.",
        )}
      </p>
      <h2>{t("6. External links and UTM parameters")}</h2>
      <p>
        {t(
          "Project links may include utm_source=spitzli.dev, utm_medium=portfolio and utm_campaign=reference. These identify the source of a link, not an individual visitor, and do not trigger visitor measurement on this website. Data is transferred to a linked provider only when you open its link. That provider’s privacy policy then applies.",
        )}
      </p>
      <h2>{t("7. Providers and international transfers")}</h2>
      <p>
        {t(
          "Hosting, database and email providers receive the data needed for their tasks. Where they act as processors, processing must be governed by agreements under Article 28 GDPR. Transfers outside the EU or EEA must also meet Articles 44 et seq. GDPR.",
        )}
      </p>
      <p>
        {t("Transfer safeguards agreed for this website: {safeguards}", {
          safeguards:
            process.env.PRIVACY_TRANSFERS ||
            t("[Providers, locations and agreed safeguards to be confirmed]"),
        })}
      </p>
      <h2>{t("8. Your rights")}</h2>
      <p>
        {t(
          "Subject to the legal requirements, you have rights of access, rectification, erasure, restriction and data portability (Articles 15–20 GDPR). You may object to processing based on legitimate interests for reasons relating to your particular situation (Article 21 GDPR). Any consent may be withdrawn for the future.",
        )}
      </p>
      <p>
        {t("Contact:")} <a href={`mailto:${site.email}`}>{site.email}</a>.{" "}
        {t(
          "You may also complain to a data protection authority, particularly where you live, work or believe an infringement occurred (Article 77 GDPR).",
        )}
      </p>
    </main>
  );
}
