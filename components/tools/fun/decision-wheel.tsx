"use client";
import { useMemo, useRef, useState } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function DecisionWheel() {
  const { text: t } = useLanguage();
  const [items, setItems] = useToolState("wheel:items", "Coffee\nTea\nWater\nJuice\nSoda");
  const [picked, setPicked] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  const list = useMemo(() => items.split("\n").map((s) => s.trim()).filter(Boolean), [items]);

  const colors = useMemo(() => {
    const palette = ["#e8a840", "#62a0c9", "#c97eb8", "#7bc96f", "#d96a6a", "#8a7fd9", "#5db8b0", "#d98a5f"];
    return list.map((_, i) => palette[i % palette.length]);
  }, [list]);

  const spin = () => {
    if (list.length === 0 || spinning) return;
    setSpinning(true);
    setPicked(null);
    const start = performance.now();
    const dur = 2500;
    const fullTurns = 6;
    const from = rotation;
    const target = from + fullTurns * 360 + 360 - (Math.random() * 360);

    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setRotation(from + (target - from) * ease(p));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        setSpinning(false);
        const slice = 360 / list.length;
        const idx = Math.floor(((360 - ((target % 360) + 180)) % 360) / slice);
        setPicked(list[idx % list.length]);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const count = list.length;

  return (
    <ToolShell
      title="Decision Wheel"
      khmerTitle="កង់សម្រេចចិត្ត"
      description="Spin the wheel to randomly pick from your list of options."
      descriptionKm="បង្វិលកង់ ដើម្បីជ្រើសរើសចៃដន្យពីបញ្ជីជម្រើសរបស់អ្នក។"
    >
      <Field label={t("Options (one per line)", "ជម្រើស (មួយក្នុងមួយបន្ទាត់)")}>
        <TextArea rows={5} value={items} onChange={(e) => setItems(e.target.value)} />
      </Field>

      <div className="flex justify-center">
        <div className="relative h-72 w-72 overflow-hidden rounded-full border-4 border-[var(--gold)] shadow-lg" style={{ background: `conic-gradient(${colors.map((c, i) => `${c} ${(i / count) * 360}deg ${((i + 1) / count) * 360}deg`).join(", ")})`, transform: `rotate(${rotation}deg)` }}>
          <div className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[18px] border-x-transparent border-t-[var(--gold)]" />
        </div>
      </div>

      <Button type="button" onClick={spin} disabled={list.length === 0 || spinning} className="w-full">
        {spinning ? t("Spinning…", "កំពុងបង្វិល…") : t("Spin", "បង្វិល")}
      </Button>

      {picked && (
        <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4 text-center">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Result", "លទ្ធផល")}</div>
          <div className="mt-1 font-display text-2xl font-semibold text-[var(--ink)]">{picked}</div>
        </div>
      )}
    </ToolShell>
  );
}