import { createElement, lazy, Suspense, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import type { ToolDef } from "@/lib/tools";

// Resolves a registry entry's `module` to a lazily loaded React component.
//
// Only client components import this file. Keeping the dynamic imports out of
// lib/tools.tsx is what stops the server-side imports of the registry (root
// layout via lib/seo, tool pages, sitemap, changelog) from turning all ~700
// tools into client references of every page — before this split every page,
// even /about, downloaded ~4 MB (compressed) of tool code.
//
// React.lazy + Suspense (rather than next/dynamic) lets the caller supply the
// fallback, so a tool page can keep its server-rendered placeholder on screen
// until the tool's chunk arrives instead of flashing a generic "Loading…".

type ToolModule = { default: ComponentType<Record<string, string>> };
type LazyToolRef = Pick<ToolDef, "id" | "module" | "props">;

const cache = new Map<string, LazyExoticComponent<ComponentType<Record<string, string>>>>();

function lazyFor(tool: LazyToolRef) {
  let C = cache.get(tool.module);
  if (!C) {
    C = lazy(() => import(`@/components/tools/${tool.module}`) as Promise<ToolModule>);
    cache.set(tool.module, C);
  }
  return C;
}

/** Start downloading a tool's code early (e.g. on hover or when a card scrolls into view). */
export function preloadTool(tool: LazyToolRef): void {
  void import(`@/components/tools/${tool.module}`).catch(() => undefined);
}

/**
 * Renders a tool's lazily loaded component inside Suspense. `lazyFor` caches one lazy component
 * per module file, so the element type is stable across renders (no remounts or lost state);
 * createElement is used because the lint rule can't see that cache and would flag a JSX tag here.
 */
export function LazyTool({ tool, fallback = null }: { tool: LazyToolRef; fallback?: ReactNode }) {
  return createElement(Suspense, { fallback }, createElement(lazyFor(tool), tool.props ?? {}));
}
