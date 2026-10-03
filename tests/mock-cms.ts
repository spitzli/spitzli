// Local UI fixture only; never imported by the application or used as a production fallback.
import { createServer } from "node:http";

const settings = {
  name: "Spitzli Development",
  owner: "Test Owner",
  email: "test@example.com",
  street: "Example 1",
  postcode: "12345",
  city: "Example",
  country: "Deutschland",
  legalReviewed: false,
  privacyReviewed: false,
  databaseProvider: "test",
  databaseRegion: "test",
  logRetention: "test",
  mailProvider: "test",
  transfers: "test",
};
const entries = [
  ["turbosmtp", "turboSMTP", "APIs & Plattformen"],
  ["stall-eichenbruch", "Stall Eichenbruch", "Webentwicklung"],
  ["imke-folkerts", "Imke Folkerts", "Webentwicklung"],
  ["luninora", "Luninora", "Webapps"],
];
createServer((request, response) => {
  if (request.headers.authorization !== "integrations API-Key test-only") {
    response.writeHead(401).end();
    return;
  }
  const url = new URL(request.url || "/", "http://127.0.0.1");
  const projects = entries.map(([slug, name, category], index) => ({
    id: index + 1,
    slug,
    name,
    category,
    client: { id: index + 1, name },
    summary:
      url.searchParams.get("locale") === "de"
        ? "Beispielprojekt für lokale Tests."
        : "Example email platform project for local tests.",
    description: "Local browser fixture.",
    website: "https://example.com",
    sortOrder: index,
    updatedAt: "2026-10-03T00:00:00Z",
    createdAt: "2026-10-03T00:00:00Z",
    _status: "published",
  }));
  const prefix = "/api/content/v1/sites/spitzli/";
  let result: unknown;
  if (url.pathname === `${prefix}settings`) result = settings;
  else if (url.pathname === `${prefix}projects`) result = projects;
  else if (url.pathname.startsWith(`${prefix}projects/`))
    result = projects.find(
      (project) => project.slug === url.pathname.slice(`${prefix}projects/`.length),
    );
  if (!result) {
    response.writeHead(404).end();
    return;
  }
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(result));
}).listen(3109, "127.0.0.1");
