import { type NextRequest, NextResponse } from "next/server";
import { browserLocale, internalPath, isLocale, localeCookie, localizePath } from "./i18n/locale";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const [, prefix, ...segments] = url.pathname.split("/");
  const preference = request.cookies.get(localeCookie)?.value;
  const detected = isLocale(preference)
    ? preference
    : browserLocale(request.headers.get("accept-language"));
  if (!isLocale(prefix)) {
    url.pathname = localizePath(internalPath(url.pathname), detected);
    const response = NextResponse.redirect(url, 307);
    response.headers.set("Vary", "Accept-Language, Cookie");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  if (url.searchParams.get("language") === prefix) {
    url.searchParams.delete("language");
    const response = NextResponse.redirect(url, 303);
    response.cookies.set(localeCookie, prefix, {
      httpOnly: true,
      sameSite: "lax",
      secure: url.protocol === "https:",
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  const path = internalPath(`/${segments.join("/")}`);
  if (/^\/(api|admin|_next)(\/|$)/.test(path)) return new NextResponse(null, { status: 404 });
  const headers = new Headers(request.headers);
  headers.set("x-spitzli-locale", prefix);
  headers.set("x-spitzli-path", path);
  const canonicalPath = localizePath(path, prefix);
  if (url.pathname !== canonicalPath) {
    url.pathname = canonicalPath;
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/((?!api(?:/|$)|admin(?:/|$)|_next(?:/|$)|.*\\..*).*)"] };
