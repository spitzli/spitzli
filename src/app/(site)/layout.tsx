import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageProvider } from "@/i18n/client";
import { localizePath } from "@/i18n/locale";
import { getI18n } from "@/i18n/server";
import { legalReady, site } from "@/lib/site";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./styles.css";
import "./refinement.css";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  const title = t("Spitzli Development — Software, APIs & Cloud");
  const description = t(
    "I develop web applications, APIs and cloud infrastructure. Dominik Spitzli — independent software developer and system architect.",
  );
  return {
    metadataBase: new URL(site.url),
    title: { default: title, template: "%s — Spitzli Development" },
    description,
    openGraph: {
      type: "website",
      locale: locale === "de" ? "de_DE" : "en_GB",
      alternateLocale: locale === "de" ? "en_GB" : "de_DE",
      siteName: site.name,
      title,
      description,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Spitzli Development" }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
    icons: { icon: "/icon.png", apple: "/apple-icon.png" },
    robots:
      legalReady && process.env.VERCEL_ENV === "production"
        ? { index: true, follow: true }
        : { index: false, follow: false },
  };
}
export const viewport: Viewport = { themeColor: "#141318", colorScheme: "dark" };

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const { locale, t } = await getI18n();
  const path = (await headers()).get("x-spitzli-path") || "/";
  const home = localizePath("/", locale);
  return (
    <html lang={locale}>
      <body>
        <LanguageProvider locale={locale}>
          <a className="skip-link" href="#main">
            {t("Skip to content")}
          </a>
          <div className="site-shell">
            <header className="site-header">
              <Link className="brand" href={home} aria-label={t("Spitzli Development — home")}>
                <Image src="/logo.png" width={44} height={44} alt="" priority />
                <span>
                  Spitzli<span className="brand-detail">Development</span>
                </span>
              </Link>
              <nav className="rail-nav" aria-label={t("Main navigation")}>
                <a href={`${home}#projekte`}>
                  {t("Work")}
                  <span aria-hidden="true">↗</span>
                </a>
                <a href={`${home}#google-cloud`}>
                  Google Cloud<span aria-hidden="true">↗</span>
                </a>
                <a href={`${home}#leistungen`}>
                  {t("Expertise")}
                  <span aria-hidden="true">↗</span>
                </a>
                <a href={`${home}#ueber-mich`}>
                  {t("About me")}
                  <span aria-hidden="true">↗</span>
                </a>
                <a href={`${home}#kontakt`}>
                  {t("Contact")}
                  <span aria-hidden="true">↗</span>
                </a>
              </nav>
              <div className="rail-bottom">
                <p className="rail-note">
                  {t("Independent developer.")}
                  <br />
                  {t("Connected thinking.")}
                </p>
                <nav className="language-switch" aria-label={t("Language")}>
                  <a
                    href={`${localizePath(path, "de")}?language=de`}
                    lang="de"
                    hrefLang="de"
                    aria-current={locale === "de" ? "page" : undefined}
                    aria-label="Deutsch"
                  >
                    DE
                  </a>
                  <span aria-hidden="true">/</span>
                  <a
                    href={`${localizePath(path, "en")}?language=en`}
                    lang="en"
                    hrefLang="en"
                    aria-current={locale === "en" ? "page" : undefined}
                    aria-label="English"
                  >
                    EN
                  </a>
                </nav>
              </div>
            </header>
            <div className="site-content">
              {!legalReady && (
                <aside className="preview-notice container">
                  {t(
                    "Preview — legal and privacy information is being reviewed before publication.",
                  )}
                </aside>
              )}
              {children}
              <footer className="site-footer container">
                <p className="footer-signoff">
                  {t("One project. Direct contact.")}
                  <br />
                  <strong>Dominik Spitzli</strong>
                </p>
                <div className="footer-meta">
                  <p>© {new Date().getFullYear()} Spitzli Development</p>
                  <nav aria-label={t("Legal information")}>
                    <Link href={localizePath("/impressum", locale)}>{t("Legal notice")}</Link>
                    <Link href={localizePath("/datenschutz", locale)}>{t("Privacy")}</Link>
                    <a href={site.companyGithub} target="_blank" rel="noopener noreferrer">
                      GitHub <span aria-hidden="true">↗</span>
                    </a>
                  </nav>
                </div>
              </footer>
            </div>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
