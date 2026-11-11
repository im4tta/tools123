"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";

function useUiText() {
  const { ui } = useLanguage();
  return (value?: string) => {
    if (!value) return value;
    return ui(value);
  };
}

export function Output({
  value,
  label,
  error,
  mono = true,
  emptyText,
  emptyTextKm,
  onRetry,
}: {
  value: string;
  label?: string;
  error?: boolean;
  mono?: boolean;
  /** Shown while there is no value yet (defaults to a generic bilingual hint). */
  emptyText?: string;
  emptyTextKm?: string;
  /** With `error`, offers a "Try again" button. */
  onRetry?: () => void;
}) {
  const ui = useUiText();
  const { text: t } = useLanguage();
  return (
    <div>
      {label && <div className="ui-label mb-1.5 text-[var(--ink-dim)]">{ui(label)}</div>}
      <div
        role={error && value ? "alert" : undefined}
        className={`relative rounded-md border px-3 py-2.5 pr-10 text-sm ${
          error
            ? "border-[var(--danger)]/50 bg-[var(--danger)]/10 text-[var(--danger)]"
            : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)]"
        }`}
      >
        {value ? (
          <div className="flex items-start gap-2">
            {error && <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />}
            <pre
              className={`max-h-72 min-w-0 flex-1 overflow-auto whitespace-pre-wrap ${mono ? "break-all font-mono-ui" : "break-words font-khmer leading-relaxed"}`}
            >
              {value}
            </pre>
          </div>
        ) : (
          <p className="text-[var(--ink-faint)]">
            {emptyText ? t(emptyText, emptyTextKm ?? emptyText) : t("The result appears here.", "លទ្ធផលនឹងបង្ហាញនៅទីនេះ។")}
          </p>
        )}
        {value && <CopyButton text={value} compact className="absolute right-2 top-2 border-0 bg-transparent" />}
        {error && onRetry && (
          <button type="button" onClick={onRetry} className="mt-2 inline-flex items-center gap-1 rounded border border-[var(--danger)]/50 px-2 py-1 text-xs font-semibold hover:bg-[var(--danger)]/10">
            <RotateCcw size={12} aria-hidden /> {t("Try again", "សាកល្បងម្ដងទៀត")}
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
  const ui = useUiText();
  return (
    <button
      {...props}
      className={`ui-touch rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[var(--on-gold)] transition hover:bg-[var(--gold-hover)] disabled:cursor-not-allowed disabled:bg-[var(--ground-raised-hi)] disabled:text-[var(--ink-faint)] ${props.className ?? ""}`}
    >
      {typeof children === "string" ? ui(children) : children}
    </button>
  );
}
