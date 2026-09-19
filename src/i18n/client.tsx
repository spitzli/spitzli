"use client";
import { createContext, type ReactNode, useContext } from "react";
import { translator } from "./index";
import type { Locale } from "./locale";

const LocaleContext = createContext<Locale>("en");
export function LanguageProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
export function useI18n() {
  return translator(useContext(LocaleContext));
}
