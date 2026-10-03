import { getPayload } from "payload";
import config from "../payload.config";
import { initialProjects } from "../src/lib/seed-data";
import { englishProjects } from "../src/lib/seed-translations";

const payload = await getPayload({ config });
try {
  for (const { clientName, ...project } of initialProjects) {
    const existingClient = await payload.find({
      overrideAccess: true,
      collection: "clients",
      where: { name: { equals: clientName } },
      limit: 1,
    });
    const client =
      existingClient.docs[0] ||
      (await payload.create({
        overrideAccess: true,
        collection: "clients",
        data: { name: clientName, website: project.website },
      }));
    const existing = await payload.find({
      overrideAccess: true,
      collection: "projects",
      locale: "de",
      fallbackLocale: false,
      where: { slug: { equals: project.slug } },
      limit: 1,
    });
    if (!existing.totalDocs) {
      const created = await payload.create({
        overrideAccess: true,
        collection: "projects",
        locale: "en",
        data: {
          ...project,
          ...englishProjects[project.slug],
          client: client.id,
          _status: "published",
        },
      });
      await payload.update({
        overrideAccess: true,
        collection: "projects",
        id: created.id,
        locale: "de",
        data: { summary: project.summary, description: project.description, _status: "published" },
      });
      console.log(`Created both languages: ${project.name}`);
    } else {
      const de = existing.docs[0];
      const en = await payload.findByID({
        overrideAccess: true,
        collection: "projects",
        id: de.id,
        locale: "en",
        fallbackLocale: false,
      });
      // Only translate untouched, already-public starter content; never overwrite CMS edits or republish drafts.
      if (
        !en.summary &&
        !en.description &&
        de._status === "published" &&
        de.summary === project.summary &&
        de.description === project.description
      ) {
        await payload.update({
          overrideAccess: true,
          collection: "projects",
          id: de.id,
          locale: "en",
          data: { ...englishProjects[project.slug], _status: "published" },
        });
        console.log(`Added missing English translation: ${project.name}`);
      }
    }
  }
  const logos = await payload.find({
    overrideAccess: true,
    collection: "media",
    locale: "de",
    fallbackLocale: false,
    where: { alt: { equals: "Spitzli Development — eigenes Logo" } },
    limit: 10,
  });
  for (const logo of logos.docs) {
    const en = await payload.findByID({
      overrideAccess: true,
      collection: "media",
      id: logo.id,
      locale: "en",
      fallbackLocale: false,
    });
    if (!en.alt)
      await payload.update({
        overrideAccess: true,
        collection: "media",
        id: logo.id,
        locale: "en",
        context: {},
        data: { alt: "Spitzli Development logo" },
      });
  }
} finally {
  await payload.destroy();
}
process.exit(0);
