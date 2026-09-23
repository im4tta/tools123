"use client";

import type { ReactNode } from "react";

// Shared toggle "pill" buttons used by option rows across tools (extracted from
// the Khmer Math Worksheet so new tools don't re-implement the same styling).

export function PillGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${active ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}
    >
      {children}
    </button>
  );
}

/** Neutral action button in the same size as a pill (Regenerate, Print, Sample…). */
export function PillAction({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:border-[var(--ink-faint)] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
