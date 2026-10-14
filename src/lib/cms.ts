import type { CMSOptions } from "@/webdock-cms/types";
import { site } from "./site";

export const cmsOptions: CMSOptions = {
  siteName: "Spitzli Development",
  siteURL: site.url,
  locales: ["en", "de"],
  defaultLocale: "en",
  modules: [
    { slug: "website-settings", kind: "global", label: "Website settings", previewPath: "/" },
    {
      slug: "projects",
      kind: "collection",
      label: "Projects",
      titleField: "name",
      previewPath: "/{locale}/projekte/{slug}",
      draftPreviewPath: "/cms/preview?module=projects&id={id}&locale={locale}",
    },
    { slug: "clients", kind: "collection", label: "Clients", titleField: "name" },
    { slug: "media", kind: "collection", label: "Images", titleField: "filename" },
  ],
};
