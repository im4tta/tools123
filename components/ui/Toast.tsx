"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { TOAST_EVENT, type ToastDetail } from "@/lib/toast";

const DISMISS_MS = 4500;
const ICONS = { success: CheckCircle2, info: Info, error: AlertCircle } as const;
const ICON_COLOR = { success: "text-[var(--success)]", info: "text-[var(--slate-accent)]", error: "text-[var(--danger)]" } as const;

/** Shows messages sent with toast() from lib/toast.ts. Mounted once in app/layout.tsx. */
export function Toaster() {
  const { text: t } = useLanguage();
  const [items, setItems] = useState<(ToastDetail & { id: number })[]>([]);

  useEffect(() => {
    let next = 0;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    function onToast(event: Event) {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      if (!detail?.text) return;
      const id = ++next;
      setItems((current) => [...current.slice(-2), { ...detail, id }]);
      const timer = setTimeout(() => {
        timers.delete(timer);
        setItems((current) => current.filter((item) => item.id !== id));
      }, DISMISS_MS);
      timers.add(timer);
    }
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div role="status" aria-live="polite" className="ui-toaster floating-toast pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex flex-col items-center gap-2 px-4">
      {items.map((item) => {
        const Icon = ICONS[item.kind];
        return (
          <div key={item.id} className="ui-toast pointer-events-auto flex max-w-md items-center gap-2.5 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] py-2.5 pl-3.5 pr-2 text-sm font-medium text-[var(--ink)] shadow-[var(--shadow-elev)]">
            <Icon size={16} className={`shrink-0 ${ICON_COLOR[item.kind]}`} aria-hidden />
            <span className="min-w-0 flex-1">{item.text}</span>
            <button
              type="button"
              onClick={() => setItems((current) => current.filter((x) => x.id !== item.id))}
              aria-label={t("Dismiss", "បិទ")}
              className="ui-touch shrink-0 rounded p-1 text-[var(--ink-dim)] hover:text-[var(--ink)]"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
