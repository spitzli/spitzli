# Spitzli Development

Next.js website with its own Payload 4 CMS at `/admin`. Content, accounts, drafts and settings live in the `spitzli` schema of the shared Neon database; its database role cannot read other instances.

## Configuration

Use Node.js 24 and `npm ci`. Copy `.env.example` to `.env.local`, configure the restricted instance database role and run `npm run dev`.

- `DATABASE_URL`: pooled runtime connection for the `spitzli` role; `DATABASE_URL_UNPOOLED`: direct migration connection for that same role.
- `PAYLOAD_SECRET`: instance authentication secret and contact IP HMAC key. Preserve it across moves.
- `OPERATOR_EMAIL`: protected operator account. Customers cannot change its identity, grant its role, or delete it.
- `BLOB_READ_WRITE_TOKEN`: current Blob store. Imported media is copied without re-encoding under `instances/spitzli`, with original dimensions, filenames and derivatives preserved. New uploads receive an instance-owned UUID path.
- SMTP and hCaptcha remain local server responsibilities. Public details, recipient email and legal approvals are edited under Website settings.

Apply only `src/migrations-instance` using `npm run cms:migrate`; automatic schema push is disabled. Bootstrap the first administrator using `OPERATOR_EMAIL`, `ADMIN_PASSWORD` and `npm run cms:bootstrap`. Use the protected operator email. Seed sample content only in disposable development databases with `npm run cms:seed`.

The one-time importer (`INSTANCE_IMPORT=spitzli npm run cms:import -- <archive.json>`) reads the archived central export without changing the source database. It requires an empty destination, restores existing account password hashes and resequences numeric IDs. Run `npm run cms:verify -- <archive.json>` to compare the archive with the instance. Keep exports and source databases for rollback. Deploy only after comparing locale content, drafts, version history, media URLs and access controls.

## Languages

Existing `/en` and `/de` pages, project details, legal notice, privacy pages and old URL redirects are preserved. UI translations live in `locales/en.po` and `locales/de.po`; `npm run i18n:compile` generates the catalogs. Project translations and image alt text are edited in this instance’s CMS.

## Kontakt und Datenschutz

- POST `/api/contact`: Origin-Prüfung, JSON- und Größenprüfung (16 KiB, auch bei gestreamtem Body), serverseitige Feldvalidierung, Honeypot und hCaptcha.
- Gemeinsames PostgreSQL-Limit: fünf Versuche pro IP-Prüfwert und 15 Minuten, atomar über alle Instanzen hinweg. Keine In-Memory-Limits.
- In Vercel ausschließlich der vom Edge gesetzte `x-vercel-forwarded-for`-Header. Außerhalb Vercels teilen sich Anfragen bewusst einen lokalen Bucket; für einen anderen Produktionshost zuerst dessen vertrauenswürdige Proxy-Konfiguration implementieren.
- Gespeichert werden nur HMAC-IP-Prüfwert, Zähler und Zeitstempel. Abgelaufene Zähler werden bei der nächsten Anfrage entfernt. Keine Nachrichten oder E-Mail-Adressen im CMS; keine Formularinhalte in eigenen Logs.
- Nachricht als Klartext an die Kontaktadresse aus **Website-Einstellungen**, fester verifizierter Absender aus `SMTP_FROM`, Besucheradresse nur als Reply-To. Keine automatische Antwort an unbestätigte Besucheradressen.
- TLS wird erzwungen: 465 direkt, 587/2525 STARTTLS. SMTP-Timeouts, Fehlerantwort statt falscher Versandbestätigung.
- `CONTACT_ENABLED=true` erst nach vollständiger Freigabe setzen. Eine SMTP-Annahme ist kein Beweis für die Zustellung ins Postfach: SPF/DKIM/DMARC, Absenderfreigabe und einen echten Zustelltest vor Launch prüfen.
- hCaptcha (`@hcaptcha/react-hcaptcha`) lädt erst nach ausdrücklicher Aktivierung. Das kompakte Widget folgt DE/EN; optionale Sentry-/User-Journey-Funktionen und reCAPTCHA-Kompatibilität sind ausgeschaltet. Deaktivieren lädt die Seite neu, ohne eine Aktivierung zu speichern.
- Sitekey in `HCAPTCHA_SITE_KEY` (öffentlich), Secret ausschließlich in `HCAPTCHA_SECRET`. Hostnamen im hCaptcha-Dashboard auf `spitzli.dev` und die benötigten eigenen Preview-Hosts beschränken. Der öffentliche Sitekey allein reicht nicht zur Aktivierung.
- Vor jedem Mailversand prüft der Server nach Rate-Limiting den Token per form-encodiertem POST an `https://api.hcaptcha.com/siteverify`, einschließlich erwarteter Sitekey und vertrauenswürdiger Client-IP. Timeout, ungültige/abgelaufene/verbrauchte Tokens und fehlerhafte Antworten verhindern den Mailversand. Tokens werden nach jedem Sendeversuch clientseitig zurückgesetzt; keine Token-/Secret-Logs. Die Siteverify-Hostname-Angabe dient laut hCaptcha nicht zur Authentifizierung.
- Offizielle hCaptcha-Testschlüssel sind in Produktion gesperrt. Lokale Browser- und Backendtests mocken das SDK bzw. Siteverify vollständig: keine Challenges automatisiert lösen und keine echten E-Mails senden. Für einen echten lokalen Widget-Test einen eigenen Entwicklungs-Hostname statt `localhost` verwenden.
- UTM nur an Website-Links: `utm_source=spitzli.dev&utm_medium=portfolio&utm_campaign=reference`. GitHub-/GitLab-/Codeberg-Links bleiben unverändert. Keine eigene Webanalyse; Website-Schriftarten sind lokal.

**Impressum und Datenschutzerklärung sind prüfpflichtige Entwürfe, keine Rechtsberatung.** Die CMS-Freigaben sind Veröffentlichungsschalter, kein automatischer Nachweis rechtlicher Konformität. Nur die bewusst zur Veröffentlichung bestimmten Kontaktdaten eintragen; niemals private Steuer-ID oder Steuernummer.

## Checks

```sh
npm run check
npm test
npm run build
npm run check:production
```

`test:integration` requires a migrated, seeded disposable local database. It checks concurrent limits, expiry and contact delivery with hCaptcha and mail mocked. It refuses remote databases and sends no email.

`test:browser` checks the running local website; `test:contact-ui` starts an isolated local frontend against the seeded local CMS database. `test:cms` exercises admin workflows. Never target production with these mutating tests.
