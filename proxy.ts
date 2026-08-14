import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALE_COOKIE = "tb-locale";

/**
 * Geo-aware locale routing. Reads the visitor's country from Vercel's
 * `x-vercel-ip-country` header (IP-based, no browser permission prompt) and
 * serves `/en` and `/km` prefixed URLs. The existing unprefixed routes keep
 * working unchanged.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rewrite /en and /km to the underlying path, recording the locale cookie.
  const localeMatch = pathname.match(/^\/(en|km)(?:\/|$)/);
  if (localeMatch) {
    const locale = localeMatch[1];
    const rest = pathname.slice(localeMatch[0].length) || "/";
    const response = NextResponse.rewrite(new URL(rest, request.url));
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  // First visit to the home page: geo-detect and redirect to the best locale.
  if (pathname === "/" && !request.cookies.has(LOCALE_COOKIE)) {
    // IP-based country detection — no browser permission prompt.
    // Vercel provides `x-vercel-ip-country`; Cloudflare provides `CF-IPCountry`.
    // Fall back to English when no header is present (self-hosted / dev).
    const country =
      (request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry") ?? "")
        .trim()
        .toUpperCase();
    // Cambodia → Khmer, otherwise English.
    const locale = country === "KH" ? "km" : "en";
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on page requests, skipping assets and metadata files.
    "/((?!_next/static|_next/image|api|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|css|js|json|woff2?|txt|map|worker\\.js)).*)",
  ],
};
