import { headers } from "next/headers";
import { cache } from "react";
import { translator } from "./index";
import { browserLocale, isLocale } from "./locale";

export const getI18n = cache(async () => {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-spitzli-locale");
  return translator(
    isLocale(locale) ? locale : browserLocale(requestHeaders.get("accept-language")),
  );
});
