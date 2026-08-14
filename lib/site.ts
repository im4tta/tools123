import { toolHref } from "@/lib/toolRoutes";

const RAW_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://123tool.app";
const NORMALIZED_SITE_URL = /^https?:\/\//i.test(RAW_SITE_URL) ? RAW_SITE_URL : `https://${RAW_SITE_URL}`;
export const BASE_URL = NORMALIZED_SITE_URL.replace(/\/$/, "");

/** Public site domain, used for watermarks and share copy. */
export const SITE_DOMAIN = "123tool.app";

export function toolUrl(id: string) {
  return `${BASE_URL}${toolHref(id)}`;
}
