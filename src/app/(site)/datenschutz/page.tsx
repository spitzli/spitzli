import type { Metadata } from "next";
import Link from "next/link";
import { languageAlternates, localizePath } from "@/i18n/locale";
import { getI18n } from "@/i18n/server";
import { getSiteSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return { title: t("Privacy"), alternates: languageAlternates("/datenschutz", locale) };
}
export default async function Datenschutz() {
  const { locale, t } = await getI18n();
  const site = await getSiteSettings();
  const legal = site;
  const legalReady = site.legalReady;
  const pending = t("[To be confirmed before publication]");
  return (
    <main id="main" className="container legal-page">
      <h1>{t("Privacy policy")}</h1>
      {!legalReady && (
        <p className="legal-warning">
          {t(
            "Draft — provider agreements, retention and transfer safeguards still require approval.",
          )}
        </p>
      )}
      <h2>{t("Controller")}</h2>
      <p>
        {site.owner} · {site.name}
        <br />
        {legal.street || t("[Business address to be added]")}
        <br />
        {legal.postcode || "[ZIP]"} {legal.city || t("[City]")},{" "}
        {legal.country === "Deutschland" ? t("Germany") : legal.country}
        <br />
        <a href={`mailto:${site.email}`}>{site.email}</a> ·{" "}
        <Link href={localizePath("/impressum", locale)}>{t("Legal notice")}</Link>
      </p>
      <h2>{t("Hosting")}</h2>
      <p>
        {t(
          "Vercel Inc. hosts this website and its images. IP address, request time, URL and browser data are processed for delivery and security (Article 6(1)(f) GDPR).",
        )}
      </p>
      <p>
        {t("Log retention: {retention}", {
          retention: site.logRetention || pending,
        })}{" "}
        <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
          {t("Vercel privacy policy")}
        </a>
      </p>
      <p>
        {t(
          "{provider} ({region}) stores administrator accounts and pseudonymous spam-protection counters.",
          {
            provider: site.databaseProvider || pending,
            region: site.databaseRegion || pending,
          },
        )}
      </p>
      <h2>{t("Contact")}</h2>
      <p>
        {t(
          "Your name, email and message are used to answer your enquiry (Article 6(1)(b) GDPR for pre-contractual enquiries, otherwise Article 6(1)(f)). The form sends via turboSMTP; my mailbox provider is {provider}. Messages are deleted when no longer needed, subject to legal retention duties.",
          { provider: site.mailProvider || pending },
        )}
      </p>
      <h2>{t("Spam protection & hCaptcha")}</h2>
      <p>
        {t(
          "A hidden form field (honeypot) and a limit of five attempts per 15 minutes prevent spam (Article 6(1)(f) GDPR). Only a keyed IP hash, counter and expiry time are stored for this limit. Expired counters are deleted on the next form request.",
        )}
      </p>
      <p>
        {t(
          "hCaptcha (Intuition Machines, Inc., USA) loads only after you activate it. It processes IP, browser and interaction data and may use browser storage to detect bots. The basis is your consent (Article 6(1)(a) GDPR and section 25(1) TDDDG). You can withdraw it with “Disable hCaptcha and reload” or contact me by email instead.",
        )}
      </p>
      <p>
        <a href="https://www.hcaptcha.com/privacy" target="_blank" rel="noopener noreferrer">
          {t("hCaptcha privacy policy")}
        </a>
      </p>
      <h2>{t("Cookies & links")}</h2>
      <p>
        {t(
          "Necessary cookies remember an explicitly chosen language for one year and an administrator login for up to two hours (section 25(2)(2) TDDDG; Article 6(1)(f) GDPR). I use no analytics. Fonts are local. Project links may contain source tags without visitor IDs; the destination’s privacy policy applies after opening a link.",
        )}
      </p>
      <h2>{t("Transfers & your rights")}</h2>
      <p>
        {t(
          "Safeguards for processing outside the EU/EEA (Articles 44 et seq. GDPR): {safeguards}",
          { safeguards: site.transfers || pending },
        )}
      </p>
      <p>
        {t(
          "Where applicable, you may request access, correction, deletion, restriction or data portability, object to processing based on legitimate interests, and withdraw consent for the future (Articles 15–21 GDPR). Contact me at the address above. You may also complain to a data protection authority, for example where you live or work (Article 77 GDPR).",
        )}
      </p>
    </main>
  );
}
