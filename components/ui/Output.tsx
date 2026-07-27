"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function Output({
  value,
  label,
  error,
  mono = true,
}: {
  value: string;
  label?: string;
  error?: boolean;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div>
      {label && (
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
          {label}
        </div>
      )}
      <div
        className={`relative rounded-md border px-3 py-2.5 pr-10 text-sm ${
          error
            ? "border-[var(--danger)]/50 bg-[var(--danger)]/10 text-[var(--danger)]"
            : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)]"
        }`}
      >
        <pre
          className={`max-h-72 overflow-auto whitespace-pre-wrap break-all ${mono ? "font-mono-ui" : ""}`}
        >
          {value || " "}
        </pre>
        {value && (
          <button
            type="button"
            onClick={copy}
            aria-label="Copy to clipboard"
            className="absolute right-2 top-2 rounded p-1.5 text-[var(--ink-faint)] hover:bg-[var(--ground-line)] hover:text-[var(--ink)]"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

export function Button({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
