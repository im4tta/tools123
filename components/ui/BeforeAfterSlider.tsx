"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export function BeforeAfterSlider({ before, after, beforeAlt = "Before", afterAlt = "After" }: { before: string; after: string; beforeAlt?: string; afterAlt?: string }) {
  const [state, setState] = useState({ before, after, position: 50 });
  const position = state.before === before && state.after === after ? state.position : 50;
  const { text } = useLanguage();
  const beforeLabel = text("Before", "មុន"), afterLabel = text("After", "ក្រោយ");
  return (
    <div className="space-y-2" role="group" aria-label={text("Before and after comparison", "ការប្រៀបធៀបមុន និងក្រោយ")}>
      <span className="sr-only">{beforeLabel}: {beforeAlt}. {afterLabel}: {afterAlt}.</span>
      <div className="relative aspect-video overflow-hidden rounded-lg border border-[var(--ground-line)] bg-[repeating-conic-gradient(#2a2e31_0%_25%,#1c1f21_0%_50%)] bg-[length:16px_16px] focus-within:ring-2 focus-within:ring-[var(--gold-dim)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain" />
        <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={after} alt="" aria-hidden="true" draggable={false} className="absolute inset-0 h-full w-full select-none object-contain" />
        </div>
        <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/65 px-2 py-1 text-[10px] text-white">{afterLabel}</span>
        <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/65 px-2 py-1 text-[10px] text-white">{beforeLabel}</span>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `calc(${position}% - 1px)` }}><span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/65 text-xs text-white">↔</span></div>
        <input type="range" min={0} max={100} value={position} onChange={(event) => setState({ before, after, position: Number(event.target.value) })} aria-label={text("Before and after comparison", "ការប្រៀបធៀបមុន និងក្រោយ")} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
      </div>
      <div className="flex justify-between text-[10px] text-[var(--ink-faint)]"><span>{afterLabel}</span><span>{beforeLabel}</span></div>
    </div>
  );
}
