import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const base = process.env.TEST_URL || "http://localhost:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("Browser checks run on localhost only.");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
await mkdir("test-results", { recursive: true });
try {
  for (const width of [320, 375, 414, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto(base);
    assert.equal(response?.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator(".project-card").count(), 4);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `overflow at ${width}`,
    );
    const clipped = await page
      .locator("h1, h2, .button, .header-contact, .email-link, .section-nav a, .site-footer a")
      .evaluateAll((nodes) =>
        nodes
          .filter((node) => {
            const rect = node.getBoundingClientRect();
            return rect.left < -1 || rect.right > innerWidth + 1;
          })
          .map((node) => node.textContent),
      );
    assert.deepEqual(clipped, [], `clipped content at ${width}`);
    const a11y = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      a11y.violations.map((item) => ({
        id: item.id,
        targets: item.nodes.map((node) => node.target),
      })),
      [],
      `a11y at ${width}`,
    );
    if ([375, 1280].includes(width))
      await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
  }
  await page.getByLabel("Bereich", { exact: true }).selectOption("Webentwicklung");
  assert.equal(await page.locator(".project-card").count(), 2);
  await page.getByLabel("Unternehmen", { exact: true }).selectOption("Luninora");
  assert.equal(await page.locator(".project-card").count(), 0);
  await page.getByRole("button", { name: "Alle Projekte zeigen" }).click();
  assert.equal(await page.locator(".project-card").count(), 4);
  await page.locator('a[href="/projekte/turbosmtp"]').first().click();
  await page.waitForURL("**/projekte/turbosmtp");
  assert.match(await page.locator("h1").innerText(), /turboSMTP/);
  assert.match(
    (await page.locator(".project-links a").first().getAttribute("href")) || "",
    /utm_source=spitzli.dev/,
  );
  for (const path of ["/impressum", "/datenschutz", "/projekte/luninora"]) {
    assert.equal((await page.goto(base + path))?.status(), 200);
    const a11y = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      a11y.violations.map((v) => v.id),
      [],
      path,
    );
  }
  assert.equal((await page.goto(`${base}/projekte/nonexistent-project`))?.status(), 404);
  const register = await page.request.post(`${base}/api/users/first-register`, {
    data: { email: "uninvited@example.com", password: "NotARealPassword-12345", name: "Blocked" },
  });
  assert.ok([400, 401, 403].includes(register.status()), `public bootstrap: ${register.status()}`);
  for (const path of ["/api/users", "/api/clients", "/api/contact-limits"]) {
    const response = await page.request.get(base + path);
    assert.ok([401, 403].includes(response.status()), `private API ${path}: ${response.status()}`);
  }
  assert.equal((await page.request.get(`${base}/robots.txt`)).status(), 200);
  await page.goto(`${base}/admin`);
  await page.waitForURL(/\/(login|create-first-user)/);
  await page.screenshot({ path: "test-results/admin.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 6 widths, accessibility, filters, detail/legal pages, 404, public API protection and admin shell.",
  );
} finally {
  await browser.close();
}
