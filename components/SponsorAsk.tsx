"use client";
import { useEffect, useState } from "react";
import { HeartHandshake, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { SponsorDialog } from "@/components/SponsorButton";
import { markSponsorAsked, SPONSOR_ASK_EVENT } from "@/lib/sponsor-ask";

/**
 * A small, non-blocking card that politely asks for support after some exports (see shouldAskForSupport in
 * lib/export.ts for when). It never covers the page: no backdrop, dismissible, and "Don't ask again" stops it.
 */
export function SponsorAsk() {
  const { text } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [dialog, setDialog] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onAsk = () => {
      // Let the download start and any "saved" toast show first.
      timer = setTimeout(() => {
        markSponsorAsked();
        setVisible(true);
      }, 1500);
    };
    window.addEventListener(SPONSOR_ASK_EVENT, onAsk);
    return () => {
      window.removeEventListener(SPONSOR_ASK_EVENT, onAsk);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (dialog) return <SponsorDialog onClose={() => setDialog(false)} />;
  if (!visible) return null;

  const later = () => setVisible(false);
  const never = () => {
    markSponsorAsked(true);
    setVisible(false);
  };

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label={text("Support 123 Toolbox", "គាំទ្រ 123 Toolbox")}
      className="fixed inset-x-3 bottom-20 z-[90] mx-auto max-w-sm rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 shadow-[var(--shadow-elev)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:mx-0"
    >
      <button
        type="button"
        onClick={later}
        aria-label={text("Close", "បិទ")}
        className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-faint)] transition hover:bg-[var(--ground-line)] hover:text-[var(--ink)]"
      >
        <X size={15} aria-hidden />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/15 text-[var(--gold-text)]">
          <HeartHandshake size={16} aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">{text("Glad that worked", "រីករាយដែលវាដំណើរការ")}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">
            {text(
              "123 Toolbox is free, with no sign-up and no ads in your files. If it saved you some time, would you consider a small contribution to help keep it that way? No pressure at all.",
              "123 Toolbox ឥតគិតថ្លៃ មិនចាំបាច់ចុះឈ្មោះ និងគ្មានពាណិជ្ជកម្មក្នុងឯកសាររបស់អ្នក។ ប្រសិនបើវាជួយសន្សំពេលវេលាអ្នក តើអ្នកអាចពិចារណាឧបត្ថម្ភបន្តិចបន្តួច ដើម្បីជួយរក្សាវាឱ្យនៅដូច្នេះបានទេ? មិនបង្ខំទេ។",
            )}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 pl-11">
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setDialog(true);
          }}
          className="rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--on-gold)] transition hover:bg-[var(--gold-hover)]"
        >
          {text("Support", "ឧបត្ថម្ភ")}
        </button>
        <button type="button" onClick={later} className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:bg-[var(--ground-line)] hover:text-[var(--ink)]">
          {text("Maybe later", "ពេលក្រោយ")}
        </button>
        <button type="button" onClick={never} className="px-1 py-1.5 text-xs text-[var(--ink-faint)] underline-offset-2 hover:underline">
          {text("Don't ask again", "កុំសួរទៀត")}
        </button>
      </div>
    </aside>
  );
}
