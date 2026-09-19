import type { Metadata } from "next";
import { legal, legalReady, site } from "@/lib/site";

export const metadata: Metadata = { title: "Impressum", alternates: { canonical: "/impressum" } };

export default function Impressum() {
  return (
    <main id="main" className="container legal-page">
      <h1>Impressum</h1>
      {!legalReady && (
        <p className="legal-warning">
          Entwurf — noch nicht zur Veröffentlichung freigegeben. Insbesondere die vollständige
          Geschäftsanschrift fehlt bzw. muss bestätigt werden.
        </p>
      )}
      <h2>Angaben nach § 5 DDG</h2>
      <address>
        <strong>Spitzli Development</strong>
        <br />
        Inhaber: Dominik Spitzli
        <br />
        Einzelunternehmer
        <br />
        {legal.street || "[Geschäftsanschrift ergänzen]"}
        <br />
        {legal.postcode || "[PLZ]"} {legal.city || "[Ort]"}
        <br />
        {legal.country}
      </address>
      <h2>Kontakt</h2>
      <p>
        E-Mail: <a href={`mailto:${site.email}`}>{site.email}</a>
        {legal.phone && (
          <>
            <br />
            Telefon: {legal.phone}
          </>
        )}
      </p>
      {legal.vatID && (
        <>
          <h2>Umsatzsteuer-Identifikationsnummer</h2>
          <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {legal.vatID}</p>
        </>
      )}
      {legal.businessID && (
        <>
          <h2>Wirtschafts-Identifikationsnummer</h2>
          <p>{legal.businessID}</p>
        </>
      )}
      {legal.register && (
        <>
          <h2>Registerangaben</h2>
          <p>{legal.register}</p>
        </>
      )}
      <h2>Inhalt und Projektverweise</h2>
      <p>
        Verantwortlich für die Inhalte dieser Website ist Dominik Spitzli. Projekt- und
        Unternehmensnamen dienen der Beschreibung meiner Arbeit. Die verlinkten Websites werden von
        ihren jeweiligen Anbietern betrieben.
      </p>
    </main>
  );
}
