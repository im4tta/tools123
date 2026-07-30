"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

type ClipboardContextValue = { copyText: (text: string) => Promise<boolean> };
const ClipboardContext = createContext<ClipboardContextValue>({ copyText: async () => false });

function fallbackCopy(text: string) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
  document.body.appendChild(area);
  area.select();
  try { return document.execCommand("copy"); } finally { area.remove(); }
}

export function ClipboardProvider({ children }: { children: ReactNode }) {
  const { text: localize } = useLanguage();
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);
  const lastCopy = useRef({ text: "", at: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const show = useCallback((message: string, error = false) => {
    setToast({ message, error });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  const copyText = useCallback(async (value: string) => {
    const text = value;
    if (!text) return false;
    if (lastCopy.current.text === text && Date.now() - lastCopy.current.at < 3000) {
      show(localize("Already copied", "បានចម្លងរួចហើយ")); return true;
    }
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) await navigator.clipboard.writeText(text);
      else if (!fallbackCopy(text)) throw new Error("Copy unavailable");
      lastCopy.current = { text, at: Date.now() };
      show(localize("Copied to clipboard", "បានចម្លងរួចរាល់")); return true;
    } catch {
      try { if (!fallbackCopy(text)) throw new Error("Copy failed"); lastCopy.current = { text, at: Date.now() }; show(localize("Copied to clipboard", "បានចម្លងរួចរាល់")); return true; }
      catch { show(localize("Could not copy", "មិនអាចចម្លងបានទេ"), true); return false; }
    }
  }, [localize, show]);
  return (
    <ClipboardContext.Provider value={{ copyText }}>
      {children}
      {toast && (
        <div role="status" aria-live="polite" className={`fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm shadow-2xl backdrop-blur ${toast.error ? "border-[var(--danger)]/50 bg-[var(--danger)]/15 text-[var(--danger)]" : "border-[var(--gold-dim)] bg-[var(--ground-raised)]/95 text-[var(--ink)]"}`}>
          {toast.error ? <CircleAlert size={16} /> : <CheckCircle2 size={16} className="text-[var(--gold)]" />}
          {toast.message}
        </div>
      )}
    </ClipboardContext.Provider>
  );
}

export function useClipboard() {
  return useContext(ClipboardContext);
}
