import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { getPayload } from "payload";
import { type BrowserContext, chromium } from "playwright";
import sharp from "sharp";
import config from "../payload.config";

const base = process.env.TEST_URL || "http://localhost:3000",
  tag = randomUUID();
if (
  ![base, process.env.DATABASE_URL || ""].every((url) =>
    ["localhost", "127.0.0.1"].includes(new URL(url).hostname),
  )
)
  throw Error("CMS browser tests require a local website and database.");
if (
  process.env.WEBDOCK_SSO_ENFORCE === "true" ||
  process.env.BLOB_READ_WRITE_TOKEN ||
  process.env.SMTP_HOST
)
  throw Error("CMS browser tests require local authentication/storage and disabled SMTP.");
const payload = await getPayload({ config });
const originalSettings = await payload.findGlobal({
  slug: "website-settings",
  overrideAccess: true,
});
const users: Record<string, { id: number; email: string }> = {};
const password = randomUUID();
let clientID: number | undefined,
  mediaID: number | undefined,
  projectID: number | undefined,
  settingsChanged = false;
mkdirSync("test-results", { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
async function auth(ctx: BrowserContext, role: string) {
  const r = await ctx.request.post(`${base}/api/users/login`, {
    data: { email: users[role].email, password },
    headers: { Origin: base },
  });
  assert.equal(r.status(), 200);
}
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());
async function settled() {
  await page.getByText("Opening your content…", { exact: true }).waitFor({ state: "hidden" });
  await page.waitForTimeout(250);
}
async function save(label: string) {
  const pending = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/api/cms" && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: label, exact: true }).click();
  const response = await pending;
  const body = await response.json();
  assert.ok(response.ok(), JSON.stringify(body));
  await settled();
  return body;
}
try {
  for (const role of ["operator", "admin", "editor", "reader"] as const) {
    const user = await payload.create({
      collection: "users",
      overrideAccess: true,
      context: { bootstrap: true },
      data: { name: "CMS browser test", email: `${role}-${tag}@example.invalid`, password, role },
    });
    users[role] = { id: user.id, email: user.email };
  }
  await auth(context, "admin");
  await page.goto(`${base}/cms`);
  await page.getByLabel("Company name", { exact: false }).waitFor();
  if (originalSettings.updatedAt) {
    settingsChanged = true;
    await page.getByLabel("Company name", { exact: false }).fill(`Synthetic CMS QA ${tag}`);
    await page.getByLabel("Street and house number", { exact: false }).fill("Test street 1");
    await page.getByLabel("Postal code", { exact: false }).fill("00000");
    await page.getByLabel("City", { exact: false }).fill("Test City");
    await save("Save changes");
    console.log("PASS global settings save");
  }
  await page.getByRole("button", { name: "Clients", exact: true }).click();
  await settled();
  await page.getByRole("button", { name: "Create new +", exact: true }).click();
  await settled();
  const clientName = `Synthetic Client ${tag}`;
  await page.getByLabel("Name", { exact: false }).fill(clientName);
  const client = await save("Save changes");
  clientID = client.doc.id;
  console.log("PASS client create");
  await page.getByRole("button", { name: "Images", exact: true }).click();
  await settled();
  await page.getByRole("button", { name: "Upload image +", exact: true }).click();
  await settled();
  const fileName = `synthetic-${tag}.png`;
  const img = await sharp({ create: { width: 80, height: 80, channels: 3, background: "#345678" } })
    .png()
    .toBuffer();
  await page
    .getByLabel("Upload image", { exact: true })
    .setInputFiles({ name: fileName, mimeType: "image/png", buffer: img });
  await page
    .getByLabel("Alternative text", { exact: false })
    .fill("Synthetic solid color QA image");
  await page
    .getByLabel("I have permission to publish this image / logo.", { exact: false })
    .check();
  const media = await save("Save changes");
  mediaID = media.doc.id;
  assert.ok(media.doc.url.startsWith(base));
  console.log("PASS local media upload");
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await settled();
  await page.getByRole("button", { name: "Create new +", exact: true }).click();
  await settled();
  await page.getByRole("combobox", { name: /Language/ }).selectOption("de");
  await settled();
  const projectName = `Synthetisches Projekt ${tag}`,
    slug = `cms-qa-${tag}`;
  await page.getByLabel(/^Name/).fill(projectName);
  await page.getByLabel(/^Slug/).fill(slug);
  await page.getByLabel(/^Summary/).fill("Gespeicherter deutscher Entwurf für den CMS-Test.");
  await page.getByLabel(/^Category/).selectOption("Webentwicklung");
  await page.getByLabel("Search Client / company", { exact: true }).fill(clientName);
  await page.getByRole("button", { name: clientName, exact: true }).click();
  await page.getByLabel("Search Approved logo / image", { exact: true }).fill(fileName);
  await page.getByRole("button", { name: fileName, exact: true }).click();
  const project = await save("Save draft");
  const id = project.doc.id;
  projectID = id;
  assert.equal(String(project.doc.client), String(client.doc.id));
  assert.equal(String(project.doc.image), String(media.doc.id));
  console.log("PASS German draft create + relationship picker");
  assert.equal((await context.request.get(`${base}/de/projekte/${slug}`)).status(), 404);
  const preview = await context.newPage();
  await preview.goto(`${base}/cms/preview?module=projects&id=${id}&locale=de`);
  await preview.getByRole("heading", { name: projectName, exact: true }).waitFor();
  await preview
    .getByText("Gespeicherter deutscher Entwurf für den CMS-Test.", { exact: true })
    .first()
    .waitFor();
  await preview.close();
  console.log("PASS authenticated saved draft preview / unpublished isolation");
  await page.getByLabel(/^Summary/).fill("Aktualisierter deutscher Entwurf.");
  await save("Save draft");
  await save("Publish");
  console.log("PASS German publish");
  const published = await context.request.get(`${base}/de/projekte/${slug}`);
  assert.equal(published.status(), 200);
  assert.match(await published.text(), /Aktualisierter deutscher Entwurf/);
  await page.getByLabel(/^Summary/).fill("Noch nicht veröffentlichte Änderung.");
  await save("Save draft");
  const stillLive = await context.request.get(`${base}/de/projekte/${slug}`);
  assert.match(await stillLive.text(), /Aktualisierter deutscher Entwurf/);
  console.log("PASS draft changes keep published version live");
  await page.screenshot({ path: "test-results/cms-mobile-project.png", fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.goto(`${base}/admin/collections/projects`);
  await page.waitForURL(`${base}/cms`);
  console.log("PASS old admin redirect");
  const denied = await page.goto(`${base}/system`);
  assert.equal(denied?.status(), 404);
  console.log("PASS admin blocked from system");
  const editorCtx = await browser.newContext();
  await auth(editorCtx, "editor");
  const del = await editorCtx.request.delete(`${base}/api/cms`, {
    headers: { Origin: base },
    data: { module: "projects", id: String(id), mode: "delete" },
  });
  assert.equal(del.status(), 403);
  const nativeDelete = await editorCtx.request.delete(`${base}/api/projects/${id}`, {
    headers: { Origin: base },
  });
  assert.equal(nativeDelete.status(), 403);
  const readerCtx = await browser.newContext();
  await auth(readerCtx, "reader");
  const readerPage = await readerCtx.newPage();
  await readerPage.goto(`${base}/cms?module=projects&id=${id}&locale=de`);
  await readerPage.getByText("You have read-only access.", { exact: false }).waitFor();
  assert.equal(
    await readerPage.getByRole("button", { name: "Save draft", exact: true }).count(),
    0,
  );
  console.log("PASS reader UI / editor delete denial");
  const operatorCtx = await browser.newContext();
  await auth(operatorCtx, "operator");
  const operatorPage = await operatorCtx.newPage();
  const system = await operatorPage.goto(`${base}/system`);
  assert.equal(system?.status(), 200);
  console.log("PASS operator system");
  const anonymous = await browser.newContext();
  const anonPreview = await anonymous.request.get(
    `${base}/cms/preview?module=projects&id=${id}&locale=de`,
    { maxRedirects: 0 },
  );
  assert.equal(anonPreview.status(), 307);
  assert.match(anonPreview.headers().location, /\/api\/sso\/login/);
  await page.goto(`${base}/cms?module=projects&id=${id}&locale=de`);
  await page.getByText("Delete this content", { exact: true }).click();
  const deleted = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/api/cms" && r.request().method() === "DELETE",
  );
  await page.getByRole("button", { name: "Delete permanently", exact: true }).click();
  assert.equal((await deleted).status(), 200);
  projectID = undefined;
  console.log("PASS admin delete / anonymous preview denial");
  assert.deepEqual(errors, []);
  console.log("CMS_BROWSER_QA_PASS");
} catch (error) {
  console.log("FAIL PAGE", page.url());
  console.log((await page.locator("body").innerText()).slice(0, 9000));
  await page.screenshot({ path: "test-results/cms-failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
  if (settingsChanged)
    await payload.updateGlobal({
      slug: "website-settings",
      overrideAccess: true,
      data: originalSettings,
    });
  if (projectID)
    await payload.delete({ collection: "projects", id: projectID, overrideAccess: true });
  if (mediaID) await payload.delete({ collection: "media", id: mediaID, overrideAccess: true });
  if (clientID) await payload.delete({ collection: "clients", id: clientID, overrideAccess: true });
  // Only the temporary operator fixture needs a direct adapter cleanup: operator deletion is intentionally blocked through application hooks.
  for (const user of Object.values(users))
    await payload.db.deleteOne({ collection: "users", where: { id: { equals: user.id } } });
  await payload.destroy();
}
process.exit(0);
