import assert from "node:assert/strict";
import test from "node:test";
import { getContent } from "../src/lib/cms";
import { getProject, getProjects } from "../src/lib/projects";

test("Central CMS reader scopes authenticated requests, preserves localized data and fails closed", async () => {
  const originalFetch = globalThis.fetch;
  const previous = { ...process.env };
  Object.assign(process.env, {
    CMS_URL: "https://cms.webdock.dev",
    CMS_SITE_KEY: "spitzli",
    CMS_API_KEY: "test-secret",
  });
  const project = {
    id: 1,
    name: "Example",
    slug: "example",
    summary: "Beschreibung",
    category: "Webapps",
    sortOrder: 1,
    updatedAt: "2026-10-03",
    createdAt: "2026-10-03",
    client: { id: 1, name: "Client" },
    image: { id: 1, alt: "", url: "https://example.com/image.png" },
    links: [{ label: "", url: "https://example.com" }],
  };
  try {
    globalThis.fetch = async (input, init) => {
      const url = new URL(String(input));
      assert.equal(url.origin, "https://cms.webdock.dev");
      assert.match(url.pathname, /^\/api\/content\/v1\/sites\/spitzli\/projects/);
      assert.equal(url.searchParams.get("locale"), "de");
      assert.equal(
        new Headers(init?.headers).get("authorization"),
        "integrations API-Key test-secret",
      );
      assert.equal(init?.redirect, "error");
      assert.equal(init?.cache, "no-store");
      assert.ok(init?.signal instanceof AbortSignal);
      return Response.json(url.pathname.endsWith("/projects") ? [project] : project);
    };
    const projects = await getProjects("de");
    assert.equal(projects[0].summary, "Beschreibung");
    assert.equal(projects[0].links?.[0].label, "example.com");
    assert.equal((await getProject("example", "de"))?.name, "Example");
    globalThis.fetch = async () => new Response(null, { status: 404 });
    assert.equal(await getProject("missing"), null);
    await assert.rejects(getContent("settings"), /404/);
    for (const status of [401, 403, 500]) {
      globalThis.fetch = async () => new Response(null, { status });
      await assert.rejects(getProject("example"), new RegExp(String(status)));
    }
    process.env.CMS_SITE_KEY = "other";
    await assert.rejects(getContent("settings"), /configuration/);
  } finally {
    globalThis.fetch = originalFetch;
    process.env = previous;
  }
});
