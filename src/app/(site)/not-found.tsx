import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="container legal-page">
      <h1>Hier ist kein Projekt.</h1>
      <p>Die Seite existiert nicht oder das Projekt ist noch nicht veröffentlicht.</p>
      <Link className="text-link" href="/#projekte">
        Zu den Projekten →
      </Link>
    </main>
  );
}
