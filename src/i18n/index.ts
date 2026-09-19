import type { Locale } from "./locale";
import de from "./messages/de.json";
import en from "./messages/en.json";

export type Messages = Record<string, string[]>;
export type Values = Record<string, string | number>;
export const catalogs: Record<Locale, Messages> = { en, de };
export function translator(locale: Locale) {
  const catalog = catalogs[locale];
  const interpolate = (text: string, values: Values = {}) =>
    text.replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));
  const t = (id: string, values?: Values) =>
    interpolate(catalog[id]?.[0] || catalogs.en[id]?.[0] || id, values);
  const ngettext = (singular: string, plural: string, count: number) => {
    // Both supported locales use gettext's n != 1 plural rule.
    const index = count === 1 ? 0 : 1;
    return interpolate(
      catalog[singular]?.[index] || catalogs.en[singular]?.[index] || (index ? plural : singular),
      { count },
    );
  };
  return { locale, t, ngettext };
}
export const categoryMessage: Record<string, string> = {
  Webentwicklung: "Web development",
  Webapps: "Web apps",
  "APIs & Plattformen": "APIs & platforms",
  "Cloud & Infrastruktur": "Cloud & infrastructure",
  "Developer Experience": "Developer experience",
  "Open Source": "Open source",
};
