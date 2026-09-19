import type { Metadata } from "next";
import Link from "next/link";
import { legal, legalReady, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Datenschutz",
  alternates: { canonical: "/datenschutz" },
};

export default function Datenschutz() {
  return (
    <main id="main" className="container legal-page">
      <h1>Datenschutzerklärung</h1>
      {!legalReady && (
        <p className="legal-warning">
          Entwurf für die geplante Vercel-Bereitstellung. Anschrift, eingesetzte Dienstleister,
          Auftragsverarbeitungsverträge, Speicherfristen und Drittlandtransfers müssen vor dem
          Livegang geprüft und bestätigt werden.
        </p>
      )}
      <h2>1. Verantwortlicher</h2>
      <p>
        Dominik Spitzli, Spitzli Development
        <br />
        {legal.street || "[Geschäftsanschrift ergänzen]"}
        <br />
        {legal.postcode || "[PLZ]"} {legal.city || "[Ort]"}, {legal.country}
        <br />
        E-Mail: <a href={`mailto:${site.email}`}>{site.email}</a>
      </p>
      <p>
        Weitere Angaben stehen im <Link href="/impressum">Impressum</Link>.
      </p>
      <h2>2. Bereitstellung der Website</h2>
      <p>
        Die Website wird auf Vercel bereitgestellt. Beim Abruf werden technisch notwendige Daten
        verarbeitet, insbesondere IP-Adresse, Zeitpunkt, angefragte URL,
        Browser-/Geräteinformationen und technische Fehlerdaten. Dies dient der Auslieferung,
        Stabilität und Sicherheit der Website. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
      </p>
      <p>
        Hosting und Bildspeicher: Vercel Inc. (Vercel und Vercel Blob). Datenschutzhinweise:{" "}
        <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
          vercel.com/legal/privacy-policy
        </a>
        . Speicherfrist der Hosting-Protokolle:{" "}
        {process.env.PRIVACY_LOG_RETENTION ||
          "[vor Veröffentlichung mit dem Hosting-Anbieter klären]"}
        .
      </p>
      <p>
        CMS-Datenbank: {process.env.PRIVACY_DATABASE_PROVIDER || "[Datenbankanbieter ergänzen]"},
        Region: {process.env.PRIVACY_DATABASE_REGION || "[Region ergänzen]"}. Die Datenbank enthält
        Projektinhalte, Administrationsdaten und die nachfolgend beschriebenen
        Missbrauchsschutzzähler, keine Kontaktanfragen.
      </p>
      <h2>3. Kontakt per E-Mail und Formular</h2>
      <p>
        Wenn du mich kontaktierst, verarbeite ich deinen Namen, deine E-Mail-Adresse und den Inhalt
        deiner Nachricht zur Bearbeitung der Anfrage. Bei vorvertraglichen oder vertraglichen
        Anfragen gilt Art. 6 Abs. 1 lit. b DSGVO, bei sonstigen Anfragen Art. 6 Abs. 1 lit. f DSGVO.
        Bitte sende keine besonders sensiblen Daten über das Formular.
      </p>
      <p>
        Der Formularversand erfolgt über turboSMTP. Empfang und weitere Bearbeitung erfolgen in
        meinem E-Mail-Postfach bei{" "}
        {process.env.PRIVACY_MAIL_PROVIDER || "[E-Mail-Postfachanbieter ergänzen]"}. Anfragen werden
        nicht im CMS gespeichert. E-Mails bewahre ich so lange auf, wie die Bearbeitung und
        gegebenenfalls gesetzliche Aufbewahrungspflichten es erfordern; anschließend werden sie
        gelöscht.
      </p>
      <h2>4. Schutz vor Missbrauch</h2>
      <p>
        Das Formular verwendet ein unsichtbares Prüffeld (Honeypot) und eine Begrenzung auf fünf
        Anfragen pro 15 Minuten. Dafür wird ein mit einem geheimen Schlüssel erzeugter Prüfwert der
        IP-Adresse zusammen mit einem Zähler und einem Ablaufzeitpunkt gespeichert. Die IP-Adresse
        selbst wird hierfür nicht in der CMS-Datenbank abgelegt. Abgelaufene Zähler werden bei der
        nächsten Formularanfrage gelöscht. Die Hosting-Protokolle sind davon unabhängig.
      </p>
      <p>
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Mein berechtigtes Interesse liegt im Schutz
        des Formulars und des E-Mail-Versands vor Spam und Überlastung. Es wird kein externer
        CAPTCHA-Dienst eingebunden.
      </p>
      <h2>5. Cookies, Schriftarten und Administration</h2>
      <p>
        Die öffentliche Website setzt keine eigenen Analyse- oder Marketing-Cookies und bindet kein
        Besuchertracking ein. Schriftarten werden lokal mit der Website ausgeliefert; es findet kein
        Abruf bei Google Fonts statt. Bilder können vom Vercel-Blob-Speicher geladen werden.
      </p>
      <p>
        Nur bei der Anmeldung im geschützten CMS wird ein technisch notwendiges Sitzungscookie
        verwendet (Sitzungslaufzeit bis zu zwei Stunden). Administrationskonten und
        Anmeldeinformationen werden zur sicheren Verwaltung der Website verarbeitet. Die technische
        Speicherung erfolgt auf Grundlage von § 25 Abs. 2 Nr. 2 TDDDG; die Verarbeitung dient dem
        berechtigten Interesse an einer sicheren Administration nach Art. 6 Abs. 1 lit. f DSGVO.
      </p>
      <h2>6. Externe Links und UTM-Parameter</h2>
      <p>
        Projektlinks können die Parameter utm_source=spitzli.dev, utm_medium=portfolio und
        utm_campaign=reference enthalten. Sie kennzeichnen die Herkunft des Links, enthalten keine
        von mir vergebene Besucherkennung und lösen auf dieser Website keine eigene Besuchsmessung
        aus. Erst wenn du einen Link öffnest, werden Daten an den jeweiligen Zielanbieter
        übertragen. Für dessen Verarbeitung gilt dessen Datenschutzerklärung.
      </p>
      <h2>7. Dienstleister und internationale Übermittlungen</h2>
      <p>
        Hosting-, Datenbank- und E-Mail-Dienstleister erhalten die für ihre Aufgabe erforderlichen
        Daten. Soweit sie als Auftragsverarbeiter tätig sind, ist die Verarbeitung durch
        Vereinbarungen nach Art. 28 DSGVO zu regeln. Bei einer Verarbeitung außerhalb der EU
        beziehungsweise des EWR sind zusätzlich die Voraussetzungen der Art. 44 ff. DSGVO
        einzuhalten.
      </p>
      <p>
        Die für diesen Auftritt vereinbarten Übermittlungsgarantien:{" "}
        {process.env.PRIVACY_TRANSFERS ||
          "[Anbieter, Verarbeitungsorte und tatsächlich vereinbarte Garantien vor Veröffentlichung ergänzen]"}
        .
      </p>
      <h2>8. Deine Rechte</h2>
      <p>
        Du hast nach den gesetzlichen Voraussetzungen das Recht auf Auskunft, Berichtigung,
        Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit (Art. 15–20 DSGVO). Bei
        einer Verarbeitung auf Grundlage berechtigter Interessen kannst du aus Gründen deiner
        besonderen Situation widersprechen (Art. 21 DSGVO). Eine gegebenenfalls erteilte
        Einwilligung kannst du mit Wirkung für die Zukunft widerrufen.
      </p>
      <p>
        Wende dich dazu an <a href={`mailto:${site.email}`}>{site.email}</a>. Außerdem kannst du
        dich bei einer Datenschutzaufsichtsbehörde beschweren, insbesondere am Ort deines
        gewöhnlichen Aufenthalts, deines Arbeitsplatzes oder des vermuteten Verstoßes (Art. 77
        DSGVO).
      </p>
    </main>
  );
}
