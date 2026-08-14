"use client";
import { useState } from "react";
import { HeartHandshake, Coffee, X } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";

const BUY_ME_A_COFFEE = "https://buymeacoffee.com/thebmeta";
const ABA_ACCOUNT = "103456789";

export function SponsorButton({ className = "" }: { className?: string }) {
  const { text } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-md border border-[var(--gold-dim)]/50 bg-[var(--gold)]/10 px-3 py-1.5 text-xs font-medium text-[var(--gold)] transition hover:bg-[var(--gold)]/20 ${className}`}
      >
        <HeartHandshake size={13} />
        {text("Sponsor", "ឧបត្ថម្ភ")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={text("Support 123 Toolbox", "គាំទ្រ 123 Toolbox")}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 shadow-2xl">            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={text("Close", "បិទ")}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-faint)] transition hover:bg-[var(--ground-line)] hover:text-[var(--ink)]"
            >
              <X size={15} />
            </button>

            <div className="mb-4 flex items-center gap-2">
              <HeartHandshake size={17} className="text-[var(--gold)]" />
              <span className="text-sm font-medium text-[var(--ink)]">
                {text("Support 123 Toolbox", "គាំទ្រ 123 Toolbox")}
              </span>
            </div>

            <a
              href={BUY_ME_A_COFFEE}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-md bg-[#FF813F] px-3 py-2.5 text-sm font-bold text-[#2b1400] transition hover:brightness-95"
            >
              <Coffee size={15} />
              Buy Me a Coffee
            </a>

            <div className="mb-2 text-center text-xs text-[var(--ink-dim)]">
              {text("or scan to pay with ABA", "ឬស្កេនដើម្បីបង់ប្រាក់តាម ABA")}
            </div>
            <div className="mx-auto mb-2 w-64 overflow-hidden rounded-md border border-[var(--ground-line)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/103456789.jpg" alt="ABA QR" className="block h-auto w-full" />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-[var(--ink-dim)]">
              <span>{text("Account", "គណនី")}: <strong className="text-[var(--ink)]">{ABA_ACCOUNT}</strong></span>
              <CopyButton text={ABA_ACCOUNT} compact />
            </div>
            <p className="mt-4 border-t border-[var(--ground-line)] pt-3 text-center text-xs text-[var(--ink-faint)]">
              {text("Thank you for your support! / សូមអរគុណចំពោះការគាំទ្ររបស់អ្នក!", "សូមអរគុណចំពោះការគាំទ្ររបស់អ្នក!")}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
