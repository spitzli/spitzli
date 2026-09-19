export const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];
export const localeCookie = "spitzli_locale";
export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "de";
}

export function browserLocale(header: string | null): Locale {
  const preferences = (header || "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = params.find((param) => param.trim().startsWith("q="));
      const weight = q ? Number(q.trim().slice(2)) : 1;
      return { language: tag.split("-")[0], weight };
    })
    .filter(({ weight }) => Number.isFinite(weight) && weight > 0 && weight <= 1)
    .sort((a, b) => b.weight - a.weight);
  for (const { language } of preferences) if (isLocale(language)) return language;
  return "en";
}

const englishPaths: Record<string, string> = {
  "/impressum": "/legal-notice",
  "/datenschutz": "/privacy",
  "/projekte": "/projects",
};
export function internalPath(path: string): string {
  for (const [internal, external] of Object.entries(englishPaths)) {
    if (path === external || path.startsWith(`${external}/`))
      return internal + path.slice(external.length);
  }
  return path;
}
export function localizePath(path: string, locale: Locale): string {
  let translated = path;
  if (locale === "en")
    for (const [internal, external] of Object.entries(englishPaths)) {
      if (path === internal || path.startsWith(`${internal}/`)) {
        translated = external + path.slice(internal.length);
        break;
      }
    }
  return `/${locale}${translated === "/" ? "" : translated}`;
}
export function languageAlternates(path: string, locale: Locale) {
  return {
    canonical: localizePath(path, locale),
    languages: {
      en: localizePath(path, "en"),
      de: localizePath(path, "de"),
      "x-default": localizePath(path, "en"),
    },
  };
}
