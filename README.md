# Spitzli Development

Persönlicher Auftritt von **Dominik Spitzli**, selbstständiger Softwareentwickler und Systemarchitekt. Next.js 16 / React 19, Payload CMS 3, PostgreSQL, Vercel Blob und turboSMTP. Öffentliches Repository: [spitzli/spitzli](https://github.com/spitzli/spitzli).

## Aktueller Stand / Freigabe

Der Auftritt enthält vier bestätigte Referenzen: turboSMTP / serverSMTP, Stall Eichenbruch, Imke Folkerts und Luninora. Keine erfundenen Beschäftigungszeiträume, Kennzahlen oder Kundenlogo-Freigaben. Keine fremden Logos oder Screenshots sind eingebunden.

**Noch nicht zum Livegang freigegeben:** Geschäftsanschrift, rechtliche Prüfung, tatsächliche Hosting-/Datenbank-/Mail-Anbieterangaben, Produktionsdatenbank, Blob-Speicher und SMTP-Zugang fehlen. Der Vercel-Produktionsbuild wird ohne diese Angaben abgebrochen. Nichtproduktive Deployments sind `noindex`; bei fehlender Freigabe wird das Formular durch einen direkten E-Mail-Kontakt ersetzt.

Die bisherigen Dateien `index.html`, `CNAME`, `.nojekyll` und `assets/logo.png` bleiben bis zur Domainumstellung erhalten. Next.js liefert die alte HTML-Seite nicht aus. GitHub Pages bedient bis zum geplanten Hosting-Wechsel weiterhin den Platzhalter. Kein DNS-Wechsel durch dieses Projekt.

## Lokal starten

Node.js 22.22+ und Docker. npm-Lockfile verwenden.

```sh
npm ci
cp .env.example .env.local
# DB_PASSWORD / DATABASE_URL auf dasselbe eigene Passwort setzen.
# PAYLOAD_SECRET mit mindestens 32 zufälligen Zeichen setzen, z.B.:
openssl rand -hex 48
# Ausgabe ausschließlich in .env.local eintragen, nicht committen.
chmod 600 .env.local

docker compose --env-file .env.local up -d --wait
npm run cms:migrate
npm run cms:seed
npm run dev
```

Website: http://localhost:3000 · CMS: http://localhost:3000/admin

Auf Linux-Systemen mit global installiertem libvips ggf. `SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm ci` verwenden. Keine globale Systembibliothek ändern.

### Ersten Administrator anlegen

Es gibt **keine öffentliche Registrierung**, auch nicht auf einer leeren Datenbank. Der First-User-Endpoint ist zusätzlich durch einen Hook gesperrt.

1. `ADMIN_EMAIL` und ein zufälliges `ADMIN_PASSWORD` (mindestens 16 Zeichen) in `.env.local` eintragen.
2. `npm run cms:bootstrap` ausführen. Das Skript verweigert den Lauf, sobald ein Administrator existiert.
3. `ADMIN_PASSWORD` aus der Datei entfernen; das Passwort in einem Passwortmanager aufbewahren.
4. In `/admin` anmelden. Weitere Administratoren dürfen nur angemeldete Administratoren anlegen.

Alle CMS-Benutzer sind Administratoren. Es gibt bewusst keine Kundenkonten. Login-Sperre nach fünf Fehlversuchen, Sitzungslaufzeit zwei Stunden. Passwortzurücksetzung benötigt konfiguriertes SMTP.

### Projekte pflegen

1. Unter **Kunden / Unternehmen** einen Eintrag erstellen, z.B. turboSMTP.
2. Unter **Projekte** ein oder mehrere Projekte diesem Unternehmen zuordnen, z.B. Developer Hub, MCP Server, CLI oder API-Tooling.
3. Beschreibung, Kategorie, Technologien, Zeitraum, Projektstatus, Website, Repository und beliebig bis zu 16 Zusatzlinks pflegen. Niedrigere Sortierungszahlen stehen zuerst; „Hervorheben“ betont die Karte.
4. Entwurf speichern oder veröffentlichen. Nur veröffentlichte Projekte erscheinen öffentlich. Änderungen werden beim nächsten Seitenaufruf sichtbar, ohne neuen Build.
5. Ein Bild ist optional. Nur freigegebene Rasterbilder bis 3 MiB hochladen; Nutzungsrechte und Alternativtext sind Pflicht. Uploads sind **öffentliche Assets**, auch wenn das Projekt noch ein Entwurf ist. Keine vertraulichen Bilder hochladen.

Der Kundenkatalog ist nicht öffentlich abrufbar. Die Website löst Kundennamen nur für veröffentlichte Projekte serverseitig auf. Für turboSMTP sind keine noch unbestätigten Einzelprojekt-URLs erfunden worden.

`cms:seed` ist wiederholbar: Es erstellt nur fehlende Einträge und überschreibt keine CMS-Änderungen oder Veröffentlichungsentscheidungen.

## Kontakt und Datenschutz

- POST `/api/contact`: Origin-Prüfung, JSON- und Größenprüfung (16 KiB, auch bei gestreamtem Body), serverseitige Feldvalidierung und Honeypot.
- Gemeinsames PostgreSQL-Limit: fünf Versuche pro IP-Prüfwert und 15 Minuten, atomar über alle Instanzen hinweg. Keine In-Memory-Limits.
- In Vercel ausschließlich der vom Edge gesetzte `x-vercel-forwarded-for`-Header. Außerhalb Vercels teilen sich Anfragen bewusst einen lokalen Bucket; für einen anderen Produktionshost zuerst dessen vertrauenswürdige Proxy-Konfiguration implementieren.
- Gespeichert werden nur HMAC-IP-Prüfwert, Zähler und Zeitstempel. Abgelaufene Zähler werden bei der nächsten Anfrage entfernt. Keine Nachrichten oder E-Mail-Adressen im CMS; keine Formularinhalte in eigenen Logs.
- Nachricht als Klartext an `CONTACT_EMAIL`, fester verifizierter Absender aus `SMTP_FROM`, Besucheradresse nur als Reply-To. Keine automatische Antwort an unbestätigte Besucheradressen.
- TLS wird erzwungen: 465 direkt, 587/2525 STARTTLS. SMTP-Timeouts, Fehlerantwort statt falscher Versandbestätigung.
- `CONTACT_ENABLED=true` erst nach vollständiger Freigabe setzen. Eine SMTP-Annahme ist kein Beweis für die Zustellung ins Postfach: SPF/DKIM/DMARC, Absenderfreigabe und einen echten Zustelltest vor Launch prüfen.
- UTM nur an Website-Links: `utm_source=spitzli.dev&utm_medium=portfolio&utm_campaign=reference`. GitHub-/GitLab-/Codeberg-Links bleiben unverändert. Kein Analytics-SDK, keine externen Fonts, kein CAPTCHA-Drittanbieter.

**Impressum und Datenschutzerklärung sind prüfpflichtige Entwürfe, keine Rechtsberatung.** Die Umgebungseinstellungen sind Veröffentlichungsschalter, kein automatischer Nachweis rechtlicher Konformität. Nur die bewusst zur Veröffentlichung bestimmten Kontaktdaten eintragen; niemals private Steuer-ID oder Steuernummer.

## Vercel

1. Repository im Team **Spitzli Development** importieren, nicht Luninora. Framework Next.js, Node 22.x, Build `npm run build`, Install `npm ci`.
2. Eigenständige PostgreSQL-Datenbank (z.B. Neon in einer passenden EU-Region) und einen **öffentlichen** Vercel Blob Store anlegen. `DATABASE_URL`, `PAYLOAD_SECRET` und `BLOB_READ_WRITE_TOKEN` als geschützte Umgebungsvariablen hinterlegen. Previews brauchen eine eigene Datenbank und einen eigenen Blob Store; niemals untrusted Branches mit Produktionssecrets versorgen.
3. Alle Einträge aus `.env.example` prüfen. Produktions-`SITE_URL=https://spitzli.dev`, ohne Pfad. Preview-Deployments verwenden automatisch ihre `VERCEL_URL`; keine beliebigen Origin-Header werden akzeptiert.
4. Migrationen vor dem ersten Start und vor Schemaänderungen aus einer vertrauenswürdigen Umgebung gegen die richtige Datenbank ausführen: `npm run cms:migrate`. Danach einmalig `cms:seed` und `cms:bootstrap`. Befehle funktionieren auch mit bereits gesetzten Umgebungsvariablen ohne lokale Env-Datei.
5. Datenbank-Backups und Wiederherstellung einrichten, Auftragsverarbeitungsverträge und Verarbeitungsorte prüfen. Tatsächliche Anbieter, Log-Aufbewahrung, E-Mail-Postfachanbieter und Transfergarantien in den `PRIVACY_*`-Feldern eintragen.
6. Impressum prüfen, fehlende Angaben ergänzen, `LEGAL_REVIEWED=true` und `PRIVACY_REVIEWED=true` erst nach Freigabe setzen. `npm run check:production` zeigt fehlende Werte, ohne Secrets auszugeben.
7. Upload/Neustart-Persistenz und echten turboSMTP-Versand prüfen, dann `CONTACT_ENABLED=true`. Erst danach die Domain an Vercel anbinden und GitHub Pages abschalten. Das öffentliche Portfolio auf der endgültigen Domain einschließlich Impressum, Datenschutz und Sitemap prüfen.

Migrationsdateien sind eingecheckt. Kein automatisches Schema-Push (`push: false`), kein Schemawechsel durch einen bloßen Seitenaufruf. Neue Migrationen: `npm run payload -- migrate:create beschreibung`; Review, Backup, Migration, Deployment. Keine Down-/Reset-Befehle gegen Produktion ohne gesonderten Wiederherstellungsplan.

## Checks

```sh
npm run check             # Biome + TypeScript
npm test                  # Validierung, sichere Links, Produktionsgate
npm run test:integration  # lokale DB: Zugriff, Entwürfe, paralleles Limit, gemockter Mailversand
npm run build
npm start                 # zweites Terminal, nur lokal für die folgenden Tests
npm run test:browser       # 320/375/414/768/1280/1920 px, axe, Filter, Routen
npm run test:cms           # temporärer Admin, CMS/REST, Entwürfe, Links und Bildfreigabe
npm run test:contact-ui    # isolierter lokaler Server; Versand vollständig abgefangen
npm audit
```

Browser installieren: `npx playwright install chromium` (unter Linux ggf. dessen Systemabhängigkeiten). Tests verweigern entfernte Datenbanken/Hosts. Temporäre Testdatensätze werden wieder gelöscht; echte SMTP-E-Mails werden nicht versendet. Screenshots landen im ignorierten `test-results/`.

DOMPurify und das alte esbuild aus Drizzles Loader sind auf gepatchte transitive Versionen eingeschränkt (`overrides`). Build, Migrationen und CMS müssen nach Änderungen dieser Overrides erneut geprüft werden.

## Struktur

- `src/app/(site)/`: öffentliche Seiten und Kontakt-Endpoint
- `src/app/(payload)/`: Payload-Admin und REST-API
- `src/collections/`: Administratoren, Kunden, Projekte, Medien, interne Limit-Zähler
- `src/lib/`: Inhalte, URL-Validierung, Kontaktschutz und Konfiguration
- `src/migrations/`: versioniertes PostgreSQL-Schema
- `tokens.css`: lokale Design-Tokens
- `scripts/`: Migration, idempotentes Seeding und gesperrter Admin-Bootstrap

Der Quellcode ist öffentlich einsehbar. Daraus folgt keine Freigabe fremder Marken, Logos oder Kundeninhalte.
