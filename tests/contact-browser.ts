import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const cms = createServer((request, response) => {
  response.setHeader("Content-Type", "application/json");
  response.end(
    JSON.stringify(
      request.url?.includes("/settings")
        ? {
            name: "Test",
            owner: "Test Owner",
            email: "test@example.com",
            street: "Test 1",
            postcode: "12345",
            city: "Test",
            country: "Deutschland",
            legalReviewed: true,
            privacyReviewed: true,
            databaseProvider: "test",
            databaseRegion: "test",
            logRetention: "test",
            mailProvider: "test",
            transfers: "test",
          }
        : [],
    ),
  );
});
await new Promise<void>((resolve) => cms.listen(3108, "127.0.0.1", resolve));
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
      CMS_URL: "http://127.0.0.1:3108",
      CMS_SITE_KEY: "spitzli",
      CMS_API_KEY: "test",
      CONTACT_ENABLED: "true",
      HCAPTCHA_SITE_KEY: "10000000-ffff-ffff-ffff-000000000001",
      HCAPTCHA_SECRET: "0x0000000000000000000000000000000000000000",
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
  const externalRequests: string[] = [];
  await context.route(/^https?:\/\//, async (route) => {
    if (!["localhost", "127.0.0.1"].includes(new URL(route.request().url()).hostname)) {
      externalRequests.push(route.request().url());
      await route.abort();
    } else await route.continue();
  });
  await context.addInitScript(() => {
    // Test double for the documented browser SDK, never a live CAPTCHA bypass.
    const state = { renders: 0, resets: 0, options: {} as Record<string, unknown> };
    const widgets = new Map<
      string,
      { root: HTMLElement; token: string; field: HTMLTextAreaElement }
    >();
    Object.assign(window, {
      __captchaTest: state,
      hcaptcha: {
        render(root: HTMLElement, options: Record<string, unknown>) {
          const id = `mock-${++state.renders}`;
          state.options = {
            sitekey: options.sitekey,
            size: options.size,
            hl: options.hl,
            sentry: options.sentry,
            userJourneys: options.userJourneys,
            reCaptchaCompat: options.reCaptchaCompat,
          };
          const field = document.createElement("textarea");
          field.name = "h-captcha-response";
          field.hidden = true;
          const widget = { root, token: "", field };
          widgets.set(id, widget);
          for (const [name, action] of [
            [
              "Solve test",
              () => {
                widget.token = `mock-token-${Date.now()}`;
                field.value = widget.token;
                (options.callback as () => void)();
              },
            ],
            [
              "Expire test",
              () => {
                (options["expired-callback"] as () => void)();
              },
            ],
            [
              "Error test",
              () => {
                (options["error-callback"] as (code: string) => void)("network-error");
              },
            ],
          ] as const) {
            const b = document.createElement("button");
            b.type = "button";
            b.textContent = name;
            b.className = "button secondary";
            b.addEventListener("click", action);
            root.appendChild(b);
          }
          root.appendChild(field);
          return id;
        },
        reset(id: string) {
          state.resets++;
          const widget = widgets.get(id);
          if (widget) {
            widget.token = "";
            widget.field.value = "";
          }
        },
        remove(id: string) {
          widgets.get(id)?.root.replaceChildren();
          widgets.delete(id);
        },
        getResponse(id: string) {
          return widgets.get(id)?.token || "";
        },
        getRespKey() {
          return "mock-reference";
        },
      },
    });
  });
  const page = await context.newPage();
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${url}/de`);
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
  assert.equal(
    await page.evaluate(() => Reflect.get(window, "__captchaTest").renders),
    0,
    "no widget before activation",
  );
  assert.deepEqual(externalRequests, [], "no third-party requests before activation");
  assert.equal(await page.getByRole("button", { name: "Anfrage senden" }).isDisabled(), true);
  await page.getByRole("button", { name: "hCaptcha laden", exact: true }).click();
  await page.getByRole("button", { name: "Solve test" }).waitFor();
  assert.deepEqual(await page.evaluate(() => Reflect.get(window, "__captchaTest").options), {
    sitekey: "10000000-ffff-ffff-ffff-000000000001",
    size: "compact",
    hl: "de",
    sentry: false,
    userJourneys: false,
    reCaptchaCompat: false,
  });
  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `active CAPTCHA overflow ${width}`,
    );
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      audit.violations.map((item) => item.id),
      [],
      `active CAPTCHA a11y ${width}`,
    );
  }
  // Intercept every submission: this browser check can never send mail.
  let succeed = false;
  await page.route("**/api/contact", async (route) => {
    const body = route.request().postDataJSON();
    assert.match(body.captcha, /^mock-token-/);
    assert.equal("h-captcha-response" in body, false, "no duplicate hidden token");
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
  await page.getByRole("button", { name: "Solve test" }).click();
  await page.getByRole("button", { name: "Expire test" }).click();
  assert.equal(await page.getByRole("button", { name: "Anfrage senden" }).isDisabled(), true);
  await page.getByText("Die Sicherheitsprüfung ist abgelaufen. Bitte wiederhole sie.").waitFor();
  await page.getByRole("button", { name: "Solve test" }).click();
  const resetsBefore = await page.evaluate(() => Reflect.get(window, "__captchaTest").resets);
  await page.getByRole("button", { name: "Anfrage senden" }).click();
  await page.getByRole("button", { name: "Wird gesendet" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Wird gesendet" }).isDisabled(), true);
  await page.getByRole("status").getByText("Bitte die markierten Felder prüfen.").waitFor();
  assert.equal(await page.locator("#email").getAttribute("aria-invalid"), "true");
  assert.equal(
    await page.locator("#message").inputValue(),
    "Ich möchte ein internes Dashboard entwickeln.",
  );
  assert.equal(await page.getByRole("button", { name: "Anfrage senden" }).isDisabled(), true);
  assert.ok(
    (await page.evaluate(() => Reflect.get(window, "__captchaTest").resets)) > resetsBefore,
    "submitted token reset",
  );
  await page.getByRole("button", { name: "Error test" }).click();
  await page
    .getByText(
      "hCaptcha konnte nicht geladen werden. Bitte erneut versuchen oder direkt per E-Mail schreiben.",
    )
    .waitFor();
  await page.getByRole("button", { name: "Prüfung erneut laden" }).click();
  await page.getByRole("button", { name: "Solve test" }).click();
  succeed = true;
  await page.getByRole("button", { name: "Anfrage senden" }).click();
  await page
    .getByText("Danke. Deine Nachricht wurde versendet. Ich melde mich bei dir.", { exact: true })
    .waitFor();
  assert.equal(await page.locator("#message").inputValue(), "");
  assert.equal(await page.getByRole("button", { name: "Anfrage senden" }).isDisabled(), true);
  await page.getByRole("button", { name: "hCaptcha deaktivieren und neu laden" }).click();
  await page.getByRole("button", { name: "hCaptcha laden", exact: true }).waitFor();
  assert.equal(
    await page.evaluate(() => Reflect.get(window, "__captchaTest").renders),
    0,
    "consent is not persisted after reload",
  );
  await page.goto(`${url}/en`);
  await page.getByRole("button", { name: "Load hCaptcha", exact: true }).click();
  await page.getByRole("button", { name: "Solve test" }).waitFor();
  assert.equal(await page.evaluate(() => Reflect.get(window, "__captchaTest").options.hl), "en");
  assert.deepEqual(externalRequests, [], "all CAPTCHA SDK and API behavior was mocked locally");
  assert.deepEqual(pageErrors, []);
  console.log(
    "PASS: mobile form, pending/disabled, field error, preserved input and success; no mail sent.",
  );
} finally {
  await browser.close();
  server.kill("SIGTERM");
  cms.close();
}
