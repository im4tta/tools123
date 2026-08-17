"use client";
import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ToolShell, Field } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

export default function TapTempo() {
  const { text: t } = useLanguage();
  const [times, setTimes] = useState<number[]>([]);
  const [lastTap, setLastTap] = useState(0);

  const tap = () => {
    const now = performance.now();
    if (lastTap > 0) {
      const delta = now - lastTap;
      if (delta > 2500) setTimes([delta]);
      else setTimes((prev) => [...prev.slice(-7), delta]);
    }
    setLastTap(now);
  };

  const display = useMemo(() => {
    if (times.length < 2) return null;
    const avg = times.reduce((s, x) => s + x, 0) / times.length;
    return 60000 / avg;
  }, [times]);

  const reset = () => {
    setTimes([]);
    setLastTap(0);
  };

  return (
    <ToolShell
      title="Tap Tempo (BPM Counter)"
      khmerTitle="វាស់ចង្វាក់ BPM"
      description="Tap along to any song to find its beats-per-minute."
      descriptionKm="ប៉ះតាមបទចម្រៀងដើម្បីស្វែងរកចង្វាក់ beats-per-minute។"
    >
      <Field label={t("Tap the button to the beat", "ប៉ះប៊ូតុងតាមចង្វាក់")}>
        <button
          type="button"
          onPointerDown={tap}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              tap();
            }
          }}
          className="w-full rounded-xl border-2 border-[var(--gold)] bg-[var(--gold)]/10 px-6 py-8 text-lg font-semibold text-[var(--ink)] transition active:scale-95 active:bg-[var(--gold)]/25"
        >
          {t("TAP", "ប៉ះ")}
        </button>
      </Field>
      {display && (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Tempo", "ចង្វាក់")}</div>
          <div className="font-display text-5xl font-semibold text-[var(--ink)]">{Math.round(display)}</div>
          <div className="mt-1 text-sm text-[var(--ink-dim)]">BPM</div>
        </div>
      )}
      <Button type="button" onClick={reset} className="w-full">
        <RotateCcw size={15} className="mr-1 inline" />
        {t("Reset", "កំណត់ឡើងវិញ")}
      </Button>
    </ToolShell>
  );
}