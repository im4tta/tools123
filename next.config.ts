import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Enforced now: directives no tool depends on. Clickjacking protection (frame-ancestors, plus
 * X-Frame-Options for older browsers), no <base> hijacking, no form posts to other origins.
 */
const ENFORCED_CSP = ["frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'"].join("; ");

/**
 * Full policy, report-only for now: pages are statically generated (no per-request nonces, see
 * node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md "Without Nonces"), and
 * tools legitimately call many third-party APIs and user-entered URLs (HTTP tester, site
 * forensics), so connect-src/img-src stay open to https:. The meaningful restriction is where
 * scripts may load from. Violations show in the browser console; enforce once they are clean.
 * srcdoc preview iframes inherit this policy, hence the CDNs they load from.
 */
const REPORT_ONLY_CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://cdn.tailwindcss.com${isDev ? "" : " https://va.vercel-scripts.com"}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob:",
  "connect-src 'self' data: blob: https:",
  "worker-src 'self' blob:",
  "frame-src 'self' blob: data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** Features some tools use (QR/Beam camera, recorders, screen capture, nearest-place lookups, clipboard, share) stay available to this origin only; the rest are off. */
const PERMISSIONS_POLICY = [
  "camera=(self)",
  "microphone=(self)",
  "geolocation=(self)",
  "display-capture=(self)",
  "clipboard-read=(self)",
  "clipboard-write=(self)",
  "web-share=(self)",
  "fullscreen=(self)",
  "payment=()",
  "usb=()",
  "serial=()",
  "hid=()",
  "bluetooth=()",
  "midi=()",
  "accelerometer=()",
  "gyroscope=()",
  "magnetometer=()",
].join(", ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: ENFORCED_CSP },
  { key: "Content-Security-Policy-Report-Only", value: REPORT_ONLY_CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  // No includeSubDomains/preload: other subdomains of the production domain are not ours to commit.
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      fs: { browser: "./lib/studio/empty-module.js" },
    },
  },
};

export default nextConfig;
