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
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
let userID: number | undefined;
let projectID: number | undefined;
let mediaID: number | undefined;
let failure: unknown;
try {
  const password = randomUUID();
  const email = `${randomUUID()}@example.com`;
  const user = await payload.create({
    collection: "users",
    context: { bootstrap: true },
    data: { name: "Temporary local test", email, password },
  });
  userID = user.id;
  const login = await context.request.post(`${base}/api/users/login`, {
    data: { email, password },
    headers: { Origin: base },
  });
  assert.equal(login.status(), 200);
  await page.goto(`${base}/admin`);
  await page.getByRole("link", { name: "Projekte", exact: true }).first().waitFor();
  await page.getByRole("link", { name: "Show all Projekte", exact: true }).click();
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
  const publish = await context.request.patch(`${base}/api/projects/${projectID}`, {
    headers: { Origin: base },
    data: { _status: "published" },
  });
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
  if (projectID) await payload.delete({ collection: "projects", id: projectID });
  if (mediaID) await payload.delete({ collection: "media", id: mediaID });
  if (userID) await payload.delete({ collection: "users", id: userID });
  await browser.close();
  await payload.destroy();
}
if (failure) console.error(failure);
process.exit(failure ? 1 : 0);
