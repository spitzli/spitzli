import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { catalogs, translator } from "../src/i18n";
import { browserLocale, internalPath, localizePath } from "../src/i18n/locale";
import { proxy } from "../src/proxy";

test("Browser language, weights and English fallback", () => {
  for (const [input, expected] of [
    ["de-CH,de;q=0.9,en;q=0.8", "de"],
    ["en-US,de;q=0.9", "en"],
    ["fr-FR,es;q=0.8", "en"],
    ["fr;q=1,de;q=0.6,en;q=0.9", "en"],
    ["de;q=0,en;q=0.2", "en"],
    ["de;q=bad,en;q=0.5", "en"],
    ["de;q=2", "en"],
    ["", "en"],
  ])
    assert.equal(browserLocale(input), expected);
});

test("Gettext catalogs, plurals and interpolation", () => {
  assert.deepEqual(Object.keys(catalogs.en).sort(), Object.keys(catalogs.de).sort());
  assert.equal(translator("de").t("Send enquiry"), "Anfrage senden");
  assert.equal(translator("en").t("Untranslated fallback"), "Untranslated fallback");
  assert.equal(translator("de").ngettext("{count} project", "{count} projects", 1), "1 Projekt");
  assert.equal(translator("de").ngettext("{count} project", "{count} projects", 0), "0 Projekte");
  assert.equal(translator("en").ngettext("{count} project", "{count} projects", 2), "2 projects");
  assert.equal(
    translator("en").t("{project}: open website in a new tab", { project: "Luninora" }),
    "Luninora: open website in a new tab",
  );
});

test("Native locale routes preserve old links, explicit preference and internal API boundaries", () => {
  const req = (path: string, headers: Record<string, string> = {}) =>
    new NextRequest(`https://spitzli.dev${path}`, { headers });
  const first = proxy(req("/", { "accept-language": "de-DE" }));
  assert.equal(first.headers.get("location"), "https://spitzli.dev/de");
  assert.equal(first.headers.get("set-cookie"), null, "no cookie without an explicit choice");
  assert.match(first.headers.get("vary") || "", /Accept-Language/);
  assert.equal(
    proxy(req("/impressum", { "accept-language": "fr" })).headers.get("location"),
    "https://spitzli.dev/en/legal-notice",
  );
  assert.equal(
    proxy(req("/", { "accept-language": "de", cookie: "spitzli_locale=en" })).headers.get(
      "location",
    ),
    "https://spitzli.dev/en",
  );
  const explicit = proxy(req("/de/impressum?language=de"));
  assert.match(explicit.headers.get("set-cookie") || "", /spitzli_locale=de/);
  assert.equal(explicit.headers.get("location"), "https://spitzli.dev/de/impressum");
  const rewrite = proxy(req("/en/projects/luninora", { "x-spitzli-locale": "de" }));
  assert.equal(rewrite.headers.get("x-middleware-next"), "1");
  assert.equal(rewrite.headers.get("x-middleware-request-x-spitzli-path"), "/projekte/luninora");
  assert.equal(rewrite.headers.get("x-middleware-request-x-spitzli-locale"), "en");
  assert.equal(proxy(req("/en/api/users")).status, 404);
  assert.equal(proxy(req("/de/admin")).status, 404);
  assert.equal(localizePath("/projekte/luninora", "en"), "/en/projects/luninora");
  assert.equal(internalPath("/legal-notice"), "/impressum");
});
