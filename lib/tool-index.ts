"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ToolDef } from "@/lib/tools";

/**
 * Lazy access to the full tool registry (lib/tools.tsx, ~50 KB gz) for client UI that only needs
 * it on interaction — tool-page header search and the command palette. Tool pages receive their
 * own tool and related tools from the server, so the registry stays out of their initial bundle;
 * it is fetched once, the first time someone starts searching.
 */

let index: readonly ToolDef[] | null = null;
let pending: Promise<readonly ToolDef[]> | null = null;
const listeners = new Set<() => void>();

export function loadToolIndex(): Promise<readonly ToolDef[]> {
  if (index) return Promise.resolve(index);
  if (!pending) {
    pending = import("@/lib/tools").then((mod) => {
      index = mod.TOOLS;
      listeners.forEach((notify) => notify());
      return index;
    });
    pending.catch(() => { pending = null; });
  }
  return pending;
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => { listeners.delete(notify); };
}

/** The registry once loaded (null before). Starts loading when `enabled` becomes true. */
export function useToolIndex(enabled: boolean): readonly ToolDef[] | null {
  const tools = useSyncExternalStore(subscribe, () => index, () => null);
  useEffect(() => {
    if (enabled && !tools) loadToolIndex().catch(() => undefined);
  }, [enabled, tools]);
  return tools;
}
