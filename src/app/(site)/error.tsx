"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="container legal-page">
      <h1>Die Seite konnte nicht geladen werden.</h1>
      <p>
        Bitte versuche es erneut. Du kannst mich weiterhin unter{" "}
        <a href="mailto:info@spitzli.dev">info@spitzli.dev</a> erreichen.
      </p>
      <button className="button secondary" type="button" onClick={reset}>
        Erneut versuchen
      </button>
    </main>
  );
}
