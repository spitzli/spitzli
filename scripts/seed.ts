import { getPayload } from "payload";
import config from "../payload.config";
import { initialProjects } from "../src/lib/seed-data";

const payload = await getPayload({ config });
try {
  for (const { clientName, ...project } of initialProjects) {
    const existingClient = await payload.find({
      collection: "clients",
      where: { name: { equals: clientName } },
      limit: 1,
    });
    const client =
      existingClient.docs[0] ||
      (await payload.create({
        collection: "clients",
        data: { name: clientName, website: project.website },
      }));
    const existingProject = await payload.find({
      collection: "projects",
      where: { slug: { equals: project.slug } },
      limit: 1,
    });
    // Idempotent: never overwrite CMS edits or re-publish a project the owner has hidden.
    if (!existingProject.totalDocs) {
      await payload.create({
        collection: "projects",
        data: { ...project, client: client.id, _status: "published" },
      });
      console.log(`Angelegt: ${project.name}`);
    }
  }
} finally {
  await payload.destroy();
}
process.exit(0);
