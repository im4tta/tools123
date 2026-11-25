"use client";
// A small Confetti burst (Jiggicons) at the bottom of the screen after a file is exported (lib/export.ts fires
// CELEBRATE_EVENT). Decorative only: hidden from screen readers, never blocks taps, skipped when the visitor prefers
// reduced motion, and silent unless "Icon sounds" is on in Settings.
import { useEffect, useState } from "react";
import { Confetti } from "jiggicons-react";
import { MotionIcon } from "@/components/ui/MotionIcon";
import { CELEBRATE_EVENT } from "@/lib/export";

const SHOW_MS = 1600;

export function Celebration() {
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    let timer = 0;
    const onCelebrate = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setBurst((n) => n + 1);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setBurst(0), SHOW_MS);
    };
    window.addEventListener(CELEBRATE_EVENT, onCelebrate);
    return () => {
      window.removeEventListener(CELEBRATE_EVENT, onCelebrate);
      window.clearTimeout(timer);
    };
  }, []);
  if (!burst) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center sm:bottom-10">
      <div className="rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 shadow-lg">
        <MotionIcon key={burst} icon={Confetti} size={40} autoplay className="text-[var(--gold-text)]" />
      </div>
    </div>
  );
}
