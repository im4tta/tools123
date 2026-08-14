"use client";
import { useEffect, useRef, useState } from "react";
import { Share2, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { BASE_URL } from "@/lib/site";

/** Listens for export-milestone events and shows a one-time share popup. */
export function ShareToast() {
  const { text } = useLanguage();
  const [open, setOpen] = useState(false);
  const [milestone, setMilestone] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onMilestone(e: Event) {
      const detail = (e as CustomEvent<{ count: number }>).detail;
      if (!detail || typeof detail.count !== "number") return;
      setMilestone(detail.count);
      setOpen(true);
    }
    window.addEventListener("tools123:export-milestone", onMilestone);
    return () => window.removeEventListener("tools123:export-milestone", onMilestone);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function close() {
    setOpen(false);
    if (timer.current) clearTimeout(timer.current);
  }

  async function share() {
    const shareUrl = BASE_URL;
    try {
      if (navigator.share) {
        await navigator.share({ title: "123 Toolbox", text: "Free browser-based tools — 123tool.app", url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // user cancelled or share unavailable
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full max-w-sm rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 shadow-2xl">
        <button
          type="button"
          onClick={close}
          aria-label={text("Close", "បិទ")}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-faint)] transition hover:bg-[var(--ground-line)] hover:text-[var(--ink)]"
        >
          <X size={15} />
        </button>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-2xl">{milestone >= 20 ? "🎉" : milestone >= 10 ? "🚀" : "🙏"}</span>
          <span className="text-sm font-semibold text-[var(--ink)]">
            {milestone === 1
              ? text("Your first export — thank you!", "ការនាំចេញដំបូងរបស់អ្នក — អរគុណ!")
              : text(`You've made ${milestone} exports!`, `អ្នកបាននាំចេញ ${milestone} ដងហើយ!`)}
          </span>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-[var(--ink-dim)]">
          {text("Enjoying the tools? Share 123 Toolbox with a friend — it helps us grow.", "ចូលចិត្តឧបករណ៍ទាំងនេះទេ? ចែករំលែក 123 Toolbox ទៅមិត្តភក្តិ — វាជួយយើងឱ្យរីកចម្រើន។")}
        </p>
        <button
          type="button"
          onClick={() => void share()}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--gold)] px-3 py-2.5 text-sm font-semibold text-[var(--ground)] transition hover:brightness-95"
        >
          <Share2 size={15} />
          {text("Share 123tool.app", "ចែករំលែក 123tool.app")}
        </button>
      </div>
    </div>
  );
}
