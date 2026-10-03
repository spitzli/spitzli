# Spitzli Development

Next.js frontend for spitzli.dev. Content is managed centrally at https://cms.webdock.dev/admin; this repository no longer contains Payload, an admin UI, CMS migrations, seed data or upload credentials.

## Configuration

Use Node.js 24 and `npm ci`. Copy `.env.example` to `.env.local`, supply a site-scoped CMS integration key, then run `npm run dev`. The CMS must be reachable for content pages; failures are surfaced rather than replaced with sample content.

- `CMS_URL=https://cms.webdock.dev`, `CMS_SITE_KEY=spitzli`, `CMS_API_KEY`: server-only content access. Never expose the key through `NEXT_PUBLIC_*`.
- Requests use `Authorization: integrations API-Key <key>` against `/api/content/v1/sites/spitzli/settings`, `/projects?locale=en|de`, and `/projects/<slug>?locale=en|de`. Content is fetched without caching. Missing projects return 404; other CMS errors fail closed.
- The central API must filter published content, sort by sortOrder/name, populate client/media at depth 1, and resolve localized content with English fallback. Existing media URLs must remain available after migration.
- `DATABASE_URL` and the legacy-named `PAYLOAD_SECRET` remain exclusively for the existing `contact_limits` PostgreSQL table and IP HMAC. Keep their existing environment-specific values for continuity. The frontend never reads old CMS tables. Restrict the database account to this table once cutover is verified; do not delete the old database while this dependency remains.
- SMTP and hCaptcha remain local server responsibilities. Public company details, recipient email, legal and privacy approvals come from the central site settings.

Deploy only after the production content export has been imported and verified in both languages, media URLs checked, and the scoped key installed. No frontend CMS migrations or bootstrap commands are needed. Keep the source export/database for rollback. Upload storage credentials belong to the central CMS only.

## Languages

Existing `/en` and `/de` pages, project details, legal notice, privacy pages and old URL redirects are preserved. UI translations live in `locales/en.po` and `locales/de.po`; `npm run i18n:compile` generates the catalogs. Project translations and image alt text are edited in the central CMS.

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

`test:integration` requires a disposable local database with the existing `contact_limits` schema. It checks concurrent limits, expiry and contact delivery with CMS, hCaptcha and mail mocked. It refuses remote databases and sends no email. The table schema is documented in `scripts/contact-limits.sql`; apply it only to a new local test database. Existing deployed databases already have it.

`test:browser` checks the running local frontend; `test:contact-ui` starts an isolated local frontend and mock CMS. Neither should target production. CMS authorization and draft isolation are tested in the central CMS repository.
