"use client";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { getWatermarkEnabled, setWatermarkEnabled } from "@/lib/export";

export function WatermarkToggle({ className = "" }: { className?: string }) {
  const { text } = useLanguage();
  const [enabled, setEnabled] = useState<boolean>(() => getWatermarkEnabled());

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setWatermarkEnabled(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={enabled}
      title={text("Show 123tool.app watermark on exported files", "បង្ហាញ watermark 123tool.app លើឯកសារដែលបាននាំចេញ")}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${enabled ? "border-[var(--ground-line)] text-[var(--ink-dim)] hover:text-[var(--ink)]" : "border-[var(--ground-line)] text-[var(--ink-faint)]"} ${className}`}
    >
      <span className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition ${enabled ? "bg-[var(--gold)]" : "bg-[var(--ground-line)]"}`}>
        <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition ${enabled ? "translate-x-3" : "translate-x-0"}`} />
      </span>
      {text("Watermark", "Watermark")}
    </button>
  );
}
