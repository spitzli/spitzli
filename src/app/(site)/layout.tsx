import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { legalReady, site } from "@/lib/site";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Spitzli Development — Software, APIs & Cloud",
    template: "%s — Spitzli Development",
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: site.name,
    title: "Spitzli Development",
    description: site.description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Spitzli Development — Software · Web · APIs · Cloud",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spitzli Development",
    description: site.description,
    images: ["/og.png"],
  },
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  robots:
    legalReady && process.env.VERCEL_ENV === "production"
      ? { index: true, follow: true }
      : { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#141318", colorScheme: "dark" };

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>
        <a className="skip-link" href="#main">
          Zum Inhalt
        </a>
        <header className="site-header container">
          <Link className="brand" href="/" aria-label="Spitzli Development — Startseite">
            <Image src="/logo.png" width={44} height={44} alt="" priority />
            <span>
              spitzli<span className="brand-detail">development</span>
            </span>
          </Link>
          <a className="header-contact" href="/#kontakt">
            Kontakt <span aria-hidden="true">↗</span>
          </a>
        </header>
        {!legalReady && (
          <aside className="preview-notice container">
            Vorschau · Impressumsangaben und Datenschutzhinweise werden vor der Veröffentlichung
            vervollständigt.
          </aside>
        )}
        {children}
        <footer className="site-footer container">
          <p>
            © {new Date().getFullYear()} Spitzli Development <span>Dominik Spitzli</span>
          </p>
          <nav aria-label="Rechtliches">
            <Link href="/impressum">Impressum</Link>
            <Link href="/datenschutz">Datenschutz</Link>
            <a href={site.companyGithub} target="_blank" rel="noopener noreferrer">
              GitHub <span aria-hidden="true">↗</span>
            </a>
          </nav>
        </footer>
      </body>
    </html>
  );
}
