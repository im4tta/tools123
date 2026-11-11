"use client";

import { createContext, useContext } from "react";
import type { ResidencyKind } from "@/lib/tool-residency";

/**
 * Facts about the tool page a ToolShell is rendered on (set by ToolRouteClient). Outside a tool
 * route, e.g. a tool opened inline on the homepage, there is no context and nothing extra shows.
 */
export const ToolPageContext = createContext<{ residency?: ResidencyKind } | null>(null);

export function useToolPage() {
  return useContext(ToolPageContext);
}
