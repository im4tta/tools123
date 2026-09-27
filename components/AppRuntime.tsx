"use client";

import { useEffect } from "react";
import { isChunkLoadError, reloadOnceForChunkError } from "@/lib/chunk-errors";

/**
 * App-wide runtime safety nets, rendered once from the root layout:
 * - registers the offline service worker (public/sw.js) in production builds only, after load
 *   so it never competes with the first paint;
 * - reloads once when a JS chunk from an older deploy fails to load.
 */
export function AppRuntime() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => undefined);
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    const onError = (event: ErrorEvent) => { if (isChunkLoadError(event.error ?? { message: event.message })) reloadOnceForChunkError(); };
    const onRejection = (event: PromiseRejectionEvent) => { if (isChunkLoadError(event.reason)) reloadOnceForChunkError(); };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
