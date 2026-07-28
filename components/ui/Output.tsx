"use client";

import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { uiKm } from "@/lib/i18n-ui";

function useUiText() {
  const { text } = useLanguage();
  return (value?: string) => {
    if (!value) return value;
    const km = uiKm(value);
    return km ? text(value, km) : value;
  };
}

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
  const ui = useUiText();
  return (
    <div>
      {label && (
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
          {ui(label)}
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
        {value && <CopyButton text={value} compact className="absolute right-2 top-2 border-0 bg-transparent" />}
      </div>
    </div>
  );
}

export function Button({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ui = useUiText();
  return (
    <button
      {...props}
      className={`rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40 ${props.className ?? ""}`}
    >
      {typeof children === "string" ? ui(children) : children}
    </button>
  );
}
