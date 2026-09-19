import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

if (!["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL || "").hostname))
  throw new Error("Requires local test database.");
const url = "http://localhost:3107";
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", "3107", "-H", "127.0.0.1"],
  {
    stdio: ["ignore", "ignore", "pipe"],
    env: {
      ...process.env,
      VERCEL: "",
      VERCEL_ENV: "",
      NODE_ENV: "production",
      SITE_URL: url,
      CONTACT_ENABLED: "true",
      LEGAL_STREET: "Test",
      LEGAL_POSTCODE: "00000",
      LEGAL_CITY: "Test",
      LEGAL_REVIEWED: "true",
      PRIVACY_REVIEWED: "true",
      PRIVACY_DATABASE_PROVIDER: "test",
      PRIVACY_DATABASE_REGION: "test",
      PRIVACY_LOG_RETENTION: "test",
      PRIVACY_MAIL_PROVIDER: "test",
      PRIVACY_TRANSFERS: "test",
      SMTP_HOST: "127.0.0.1",
      SMTP_USER: "test",
      SMTP_PASSWORD: "test",
      SMTP_FROM: "test@example.com",
    },
  },
);
server.stderr.on("data", () => {});
const browser = await chromium.launch();
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${url}/icon.png`)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await delay(250);
  }
  assert.ok(ready, "isolated contact test server started");
  const context = await browser.newContext({ locale: "de-DE" });
  const page = await context.newPage();
  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url);
    await page.getByRole("button", { name: "Anfrage senden" }).waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      audit.violations.map((item) => item.id),
      [],
      `form a11y ${width}`,
    );
  }
  // Intercept every submission: this browser check can never send mail.
  let succeed = false;
  await page.route("**/api/contact", async (route) => {
    await delay(300);
    await route.fulfill({
      status: succeed ? 200 : 400,
      contentType: "application/json",
      body: JSON.stringify(
        succeed
          ? { ok: true }
          : {
              error: "Bitte die markierten Felder prüfen.",
              fields: { email: "Bitte eine gültige E-Mail-Adresse angeben." },
            },
      ),
    });
  });
  await page.getByLabel("Dein Name", { exact: true }).fill("Ada Beispiel");
  await page.getByLabel("E-Mail-Adresse", { exact: true }).fill("ada@example.com");
  await page
    .getByLabel("Was möchtest du entwickeln?", { exact: true })
    .fill("Ich möchte ein internes Dashboard entwickeln.");
  await page.getByRole("button", { name: "Anfrage senden" }).click();
  await page.getByRole("button", { name: "Wird gesendet" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Wird gesendet" }).isDisabled(), true);
  await page.getByRole("status").getByText("Bitte die markierten Felder prüfen.").waitFor();
  assert.equal(await page.locator("#email").getAttribute("aria-invalid"), "true");
  assert.equal(
    await page.locator("#message").inputValue(),
    "Ich möchte ein internes Dashboard entwickeln.",
  );
  succeed = true;
  await page.getByRole("button", { name: "Anfrage senden" }).click();
  await page
    .getByText("Danke. Deine Nachricht wurde versendet. Ich melde mich bei dir.", { exact: true })
    .waitFor();
  assert.equal(await page.locator("#message").inputValue(), "");
  console.log(
    "PASS: mobile form, pending/disabled, field error, preserved input and success; no mail sent.",
  );
} finally {
  await browser.close();
  server.kill("SIGTERM");
}
