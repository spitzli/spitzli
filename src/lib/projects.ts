import config from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";

export const getProjects = cache(async () => {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "projects",
    // Resolve client names only through published projects; the client directory stays private.
    overrideAccess: true,
    depth: 1,
    where: { _status: { equals: "published" } },
    sort: ["sortOrder", "name"],
    pagination: false,
  });
  return result.docs;
});

export const getProject = cache(async (slug: string) => {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "projects",
    overrideAccess: true,
    depth: 1,
    limit: 1,
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }] },
  });
  return result.docs[0] || null;
});
