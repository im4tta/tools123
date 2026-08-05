import { toolHref } from "@/lib/toolRoutes";
import type { ParsedIntent } from "@/lib/intent-parser";

export interface RoutedIntent {
  toolId: string;
  href: string;
}

/** Convert a parsed intent into an existing canonical tool URL. */
export function routeIntent(intent: ParsedIntent, rawInput: string): RoutedIntent | null {
  if (!intent.toolId) return null;
  return {
    toolId: intent.toolId,
    href: `${toolHref(intent.toolId)}?input=${encodeURIComponent(rawInput.trim())}`,
  };
}
