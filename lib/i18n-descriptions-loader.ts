"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * On-demand access to lib/i18n-descriptions (the Khmer text for every tool description, ~22 KB
 * gz). Only the Khmer and bilingual modes need it, so English (and other-language) visitors never
 * download it; Khmer/bilingual tool pages start loading it in parallel with the tool's own code
 * and keep the server-rendered placeholder up until both have arrived, so there is no flash of
 * English text (see components/ToolRouteClient.tsx).
 */

type Lookup = (description: string) => string | undefined;

let lookup: Lookup | null = null;
let pending: Promise<Lookup> | null = null;
const listeners = new Set<() => void>();

export function loadDescriptionsKm(): Promise<Lookup> {
  if (lookup) return Promise.resolve(lookup);
  if (!pending) {
    pending = import("@/lib/i18n-descriptions").then((mod) => {
      lookup = mod.descriptionKmFor;
      listeners.forEach((notify) => notify());
      return lookup;
    });
    pending.catch(() => { pending = null; });
  }
  return pending;
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => { listeners.delete(notify); };
}

/** The lookup once loaded (null before); starts loading when `needed` becomes true. */
export function useDescriptionsKm(needed: boolean): Lookup | null {
  const fn = useSyncExternalStore(subscribe, () => lookup, () => null);
  useEffect(() => {
    if (needed && !fn) loadDescriptionsKm().catch(() => undefined);
  }, [needed, fn]);
  return fn;
}

/** Whether the active language shows Khmer tool descriptions. */
export function modeNeedsKhmerDescriptions(mode: string): boolean {
  return mode === "km" || mode === "bi";
}
