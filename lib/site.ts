import { toolHref } from "@/lib/toolRoutes";

export const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://123tool.app").replace(/\/$/, "");

/** Public site domain, used for watermarks and share copy. */
export const SITE_DOMAIN = "123tool.app";

export function toolUrl(id: string) {
  return `${BASE_URL}${toolHref(id)}`;
}
