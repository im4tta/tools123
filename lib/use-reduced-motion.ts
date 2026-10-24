"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(notify: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

/**
 * Whether the visitor asked the OS to reduce motion. For motion driven from JavaScript (autoplay
 * timers, scripted scrolling); CSS animations are already stilled by the reset in globals.css.
 * False during server rendering and hydration, then the real value.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}

/** "smooth" unless the visitor prefers reduced motion. Read at call time, for event handlers. */
export function preferredScrollBehavior(): ScrollBehavior {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches ? "auto" : "smooth";
}
