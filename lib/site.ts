import { toolHref } from "@/lib/toolRoutes";

export const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tools123.vercel.app").replace(/\/$/, "");

export function toolUrl(id: string) {
  return `${BASE_URL}${toolHref(id)}`;
}
