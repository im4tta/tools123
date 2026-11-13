import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { trackAgents } from "@databuddy/sdk/agents";

const LOCALE_COOKIE = "tb-locale";

function localeCookieOptions(request: NextRequest) {
  return { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const, secure: request.nextUrl.protocol === "https:" };
}

/**
 * Geo-aware locale routing. Reads the visitor's country from Vercel's
 * `x-vercel-ip-country` header (IP-based, no browser permission prompt) and
 * serves `/en` and `/km` prefixed URLs. The existing unprefixed routes keep
 * working unchanged.
 *
 * Also reports visits from AI crawlers and agents (GPTBot, ClaudeBot, …), which never run the
 * browser tracker, to Databuddy. Only requests whose headers identify an agent are sent; the
 * response does not wait for it. Off when NEXT_PUBLIC_DATABUDDY_CLIENT_ID is unset.
 */
export function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;
  const databuddyId = process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID;
  if (databuddyId) event.waitUntil(trackAgents(request, { websiteId: databuddyId }));

  // Rewrite /en and /km to the underlying path, recording the locale cookie.
  const localeMatch = pathname.match(/^\/(en|km)(?:\/|$)/);
  if (localeMatch) {
    const locale = localeMatch[1];
    const rest = pathname.slice(localeMatch[0].length) || "/";
    const response = NextResponse.rewrite(new URL(rest, request.url));
    response.cookies.set(LOCALE_COOKIE, locale, localeCookieOptions(request));
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
    response.cookies.set(LOCALE_COOKIE, locale, localeCookieOptions(request));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on page requests, skipping assets. Text files (llms.txt, robots.txt) stay in so AI
    // crawler visits to them are counted.
    "/((?!_next/static|_next/image|api|favicon.ico|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|css|js|json|woff2?|map|worker\\.js)).*)",
  ],
};
