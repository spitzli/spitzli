// Only imported by server content readers; never expose the integration key to the browser.
export async function getContent<T>(path: string, allowNotFound = false): Promise<T> {
  const { CMS_URL, CMS_API_KEY, CMS_SITE_KEY } = process.env;
  if (!CMS_URL || !CMS_API_KEY || CMS_SITE_KEY !== "spitzli")
    throw new Error("Central CMS configuration is missing or invalid.");
  const url = new URL(`/api/content/v1/sites/${CMS_SITE_KEY}/${path}`, CMS_URL);
  const response = await fetch(url, {
    headers: { Authorization: `integrations API-Key ${CMS_API_KEY}` },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  if (allowNotFound && response.status === 404) return null as T;
  if (!response.ok) throw new Error(`Central CMS request failed (${response.status}).`);
  return response.json() as Promise<T>;
}
