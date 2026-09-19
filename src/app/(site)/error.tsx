"use client";
import { useI18n } from "@/i18n/client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useI18n();
  return (
    <main id="main" className="container legal-page">
      <h1>{t("This page could not be loaded.")}</h1>
      <p>
        {t("Please try again or email me directly.")}{" "}
        <a href="mailto:info@spitzli.dev">info@spitzli.dev</a>
      </p>
      <button className="button secondary" type="button" onClick={reset}>
        {t("Try again")}
      </button>
    </main>
  );
}
