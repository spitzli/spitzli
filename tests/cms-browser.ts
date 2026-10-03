import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { getPayload } from "payload";
import { chromium } from "playwright";
import sharp from "sharp";
import config from "../payload.config";

const base = process.env.TEST_URL || "http://localhost:3000";
if (
  ![base, process.env.DATABASE_URL || ""].every((url) =>
    ["localhost", "127.0.0.1"].includes(new URL(url).hostname),
  )
)
  throw new Error("CMS tests require a local website and database.");
const payload = await getPayload({ config });
const originalSettings = await payload.findGlobal({
  slug: "website-settings",
  overrideAccess: true,
});
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
let userID: number | undefined;
let projectID: number | undefined;
let germanOnlyID: number | undefined;
let mediaID: number | undefined;
let failure: unknown;
try {
  const password = randomUUID();
  const email = `${randomUUID()}@example.com`;
  const user = await payload.create({
    overrideAccess: true,
    collection: "users",
    context: { bootstrap: true },
    data: { name: "Temporary local test", email, password, role: "admin" },
  });
  userID = user.id;
  const login = await context.request.post(`${base}/api/users/login`, {
    data: { email, password },
    headers: { Origin: base },
  });
  assert.equal(login.status(), 200);
  const deniedSettings = await fetch(`${base}/api/globals/website-settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "attacker@example.com" }),
  });
  assert.equal(deniedSettings.status, 403);
  await page.goto(`${base}/admin/globals/website-settings`);
  await page.getByLabel("Company name", { exact: false }).waitFor();
  const settingsUpdate = await context.request.post(`${base}/api/globals/website-settings`, {
    headers: { Origin: base },
    data: {
      email: "cms-live@example.com",
      vatID: "DE123456789",
      name: "CMS Company",
      owner: "CMS Owner",
    },
  });
  assert.equal(settingsUpdate.status(), 200, await settingsUpdate.text());
  await page.goto(`${base}/de/impressum`);
  await page.getByText("CMS Company", { exact: true }).first().waitFor();
  await page.getByRole("link", { name: "cms-live@example.com", exact: true }).waitFor();
  assert.match(await page.locator("main").innerText(), /DE123456789/);
  assert.match(await page.locator("main").innerText(), /CMS Owner/);
  await payload.updateGlobal({
    slug: "website-settings",
    overrideAccess: true,
    data: originalSettings,
  });
  await page.goto(`${base}/admin`);
  await page.getByRole("link", { name: "Projects", exact: true }).first().waitFor();
  await page.getByRole("link", { name: "Show all Projects", exact: true }).click();
  await page.waitForURL("**/admin/collections/projects");
  await page.getByText("turboSMTP / serverSMTP", { exact: true }).first().waitFor();
  await page.getByText("Loading...", { exact: true }).first().waitFor({ state: "hidden" });
  await page.screenshot({ path: "test-results/cms-projects.png", fullPage: true });
  const slug = `browser-${randomUUID()}`;
  const create = await context.request.post(`${base}/api/projects`, {
    headers: { Origin: base },
    data: {
      name: "Browser test",
      slug,
      summary: "Temporary local CRUD test",
      category: "Developer Experience",
      sortOrder: 999,
      _status: "draft",
      links: [{ label: "Documentation", url: "https://example.com/docs" }],
      repository: "https://github.com/spitzli/spitzli",
    },
  });
  assert.equal(create.status(), 201, await create.text());
  projectID = (await create.json()).doc.id;
  assert.equal((await context.request.get(`${base}/projekte/${slug}`)).status(), 404);
  const publish = await context.request.patch(
    `${base}/api/projects/${projectID}?publishAllLocales=true`,
    {
      headers: { Origin: base },
      data: { _status: "published" },
    },
  );
  assert.equal(publish.status(), 200, await publish.text());
  await page.goto(`${base}/projekte/${slug}`);
  assert.match(
    (await page.getByRole("link", { name: "Documentation" }).getAttribute("href")) || "",
    /utm_source=spitzli.dev/,
  );
  assert.equal(
    await page.getByRole("link", { name: "Repository" }).getAttribute("href"),
    "https://github.com/spitzli/spitzli",
  );
  const germanOnly = await context.request.post(`${base}/api/projects?locale=de`, {
    headers: { Origin: base },
    data: {
      name: "German-only test",
      slug: `${slug}-de`,
      summary: "Nur deutsche Beschreibung",
      category: "Webapps",
      _status: "published",
      links: [{ label: "Dokumentation", url: "https://example.com/docs" }],
    },
  });
  assert.equal(germanOnly.status(), 201);
  germanOnlyID = (await germanOnly.json()).doc.id;
  assert.equal(
    (await page.goto(`${base}/en/projects/${slug}-de`))?.status(),
    404,
    "Publishing German must not publish the English draft",
  );
  const publishTranslations = await context.request.patch(
    `${base}/api/projects/${germanOnlyID}?locale=de&publishAllLocales=true`,
    { headers: { Origin: base }, data: { _status: "published" } },
  );
  assert.equal(publishTranslations.status(), 200, await publishTranslations.text());
  assert.equal((await page.goto(`${base}/en/projects/${slug}-de`))?.status(), 200);
  await page
    .getByText("A description is not yet available in this language.", { exact: true })
    .first()
    .waitFor();
  assert.equal(await page.getByRole("link", { name: "example.com" }).count(), 1);
  assert.equal((await page.goto(`${base}/de/projekte/${slug}`))?.status(), 200);
  await page.getByText("Temporary local CRUD test", { exact: true }).first().waitFor();
  const png = await sharp({ create: { width: 24, height: 24, channels: 3, background: "#cccccc" } })
    .png()
    .toBuffer();
  for (const rightsConfirmed of [false, true]) {
    const upload = await context.request.post(`${base}/api/media`, {
      headers: { Origin: base },
      multipart: {
        _payload: JSON.stringify({ alt: "Temporary local upload test", rightsConfirmed }),
        file: { name: `test-${randomUUID()}.png`, mimeType: "image/png", buffer: png },
      },
    });
    if (!rightsConfirmed) assert.equal(upload.status(), 400, "uncleared images rejected");
    else {
      assert.equal(upload.status(), 201, await upload.text());
      mediaID = (await upload.json()).doc.id;
    }
  }
  console.log(
    "PASS: authenticated CMS, CRUD, draft isolation, multiple project links and image-rights validation.",
  );
} catch (error) {
  failure = error;
} finally {
  await payload.updateGlobal({
    slug: "website-settings",
    overrideAccess: true,
    data: originalSettings,
  });
  if (projectID)
    await payload.delete({ overrideAccess: true, collection: "projects", id: projectID });
  if (germanOnlyID)
    await payload.delete({ overrideAccess: true, collection: "projects", id: germanOnlyID });
  if (mediaID) await payload.delete({ overrideAccess: true, collection: "media", id: mediaID });
  if (userID) await payload.delete({ overrideAccess: true, collection: "users", id: userID });
  await browser.close();
  await payload.destroy();
}
if (failure) console.error(failure);
process.exit(failure ? 1 : 0);
