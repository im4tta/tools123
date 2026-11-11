// App-wide toast messages. Any component calls toast(text) with already-localized text; the
// <Toaster /> mounted in app/layout.tsx shows it (polite live region, auto-dismiss). An event, like
// the share prompt's "tools123:export-milestone", so tools need no provider or context.

export type ToastKind = "success" | "info" | "error";
export interface ToastDetail { text: string; kind: ToastKind }

export const TOAST_EVENT = "tools123:toast";

export function toast(text: string, kind: ToastKind = "success"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { text, kind } }));
}
