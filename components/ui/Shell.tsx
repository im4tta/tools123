"use client";

import { Children, cloneElement, isValidElement, ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { uiKm } from "@/lib/i18n-ui";
import { descriptionKmFor } from "@/lib/i18n-descriptions";
import { toKhmerToolTitle } from "@/lib/tool-title-km";

/** Localises a shared UI string through the dictionary, keeping English when untranslated. */
function useUiText() {
  const { text } = useLanguage();
  return (value?: string) => {
    if (!value) return value;
    const km = uiKm(value);
    return km ? text(value, km) : value;
  };
}

export function ToolShell({
  title,
  khmerTitle,
  description,
  descriptionKm,
  children,
}: {
  title: string;
  khmerTitle?: string;
  description: string;
  descriptionKm?: string;
  children: ReactNode;
}) {
  const { mode, text } = useLanguage();
  const resolvedKhmerTitle = khmerTitle ?? toKhmerToolTitle(title);
  const localizedTitle = mode === "km" ? resolvedKhmerTitle : title;
  const resolvedDescriptionKm = descriptionKm ?? descriptionKmFor(description);
  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-8">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">{localizedTitle}</h1>
          {mode === "bi" && resolvedKhmerTitle !== title && (
            <span lang="km" className="font-khmer text-lg text-[var(--gold)]">{resolvedKhmerTitle}</span>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">{resolvedDescriptionKm ? text(description, resolvedDescriptionKm) : description}</p>
      </header>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

export function Field({
  label,
  labelKm,
  hint,
  hintKm,
  children,
}: {
  label: string;
  labelKm?: string;
  hint?: string;
  hintKm?: string;
  children: ReactNode;
}) {
  const { text } = useLanguage();
  const ui = useUiText();
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
          {labelKm ? text(label, labelKm) : ui(label)}
        </span>
        {hint && <span className="text-xs text-[var(--ink-faint)]">{hintKm ? text(hint, hintKm) : ui(hint)}</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--gold-dim)] focus:ring-1 focus:ring-[var(--gold-dim)]";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const ui = useUiText();
  return <input {...props} placeholder={ui(props.placeholder)} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ui = useUiText();
  return (
    <textarea
      {...props}
      placeholder={ui(props.placeholder)}
      className={`${inputClass} font-mono-ui resize-y ${props.className ?? ""}`}
    />
  );
}

/**
 * Localises literal <option> text (and <optgroup> labels) so every dropdown in
 * every tool follows the active language without touching each tool file.
 * Dynamic children (expressions, dataset-driven lists) are left untouched.
 */
function localizeOptions(children: ReactNode, ui: (value?: string) => string | undefined): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    if (child.type === "optgroup") {
      const props = child.props as { label?: string; children?: ReactNode };
      return cloneElement(child as React.ReactElement<{ label?: string; children?: ReactNode }>, {
        label: ui(props.label),
        children: localizeOptions(props.children, ui),
      });
    }
    if (child.type !== "option") return child;
    const props = child.props as { children?: ReactNode };
    return typeof props.children === "string"
      ? cloneElement(child as React.ReactElement<{ children?: ReactNode }>, { children: ui(props.children) })
      : child;
  });
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const ui = useUiText();
  return (
    <select {...props} className={`${inputClass} ${props.className ?? ""}`}>
      {localizeOptions(children, ui)}
    </select>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}
