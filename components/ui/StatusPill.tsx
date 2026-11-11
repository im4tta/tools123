"use client";

import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";

export type StatusKind = "ok" | "info" | "warn" | "error" | "busy";

const STYLE: Record<StatusKind, { icon: typeof Info; tone: string }> = {
  ok: { icon: CheckCircle2, tone: "border-[var(--success)]/40 bg-[var(--success)]/10 [&>svg]:text-[var(--success)]" },
  info: { icon: Info, tone: "border-[var(--slate-accent)]/40 bg-[var(--slate-accent)]/10 [&>svg]:text-[var(--slate-accent)]" },
  warn: { icon: AlertTriangle, tone: "border-[var(--gold)]/50 bg-[var(--gold)]/10 [&>svg]:text-[var(--gold-text)]" },
  error: { icon: AlertCircle, tone: "border-[var(--danger)]/40 bg-[var(--danger)]/10 [&>svg]:text-[var(--danger)]" },
  busy: { icon: Loader2, tone: "border-[var(--ground-line)] bg-[var(--ground-raised)] [&>svg]:animate-spin [&>svg]:text-[var(--ink-dim)]" },
};

/**
 * A short status ("Processed on this device", "3 errors", "Reading…"): an icon, colour and text
 * together, never colour alone. Text stays in --ink so it reads on every tint. Pass `live` for
 * statuses that change while the user waits.
 */
export function StatusPill({ kind = "info", live = false, children }: { kind?: StatusKind; live?: boolean; children: ReactNode }) {
  const { icon: Icon, tone } = STYLE[kind];
  return (
    <span
      role={live ? (kind === "error" ? "alert" : "status") : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-[var(--ink)] ${tone}`}
    >
      <Icon size={13} aria-hidden />
      {children}
    </span>
  );
}
