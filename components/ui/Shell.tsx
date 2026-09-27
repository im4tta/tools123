"use client";

import { Children, cloneElement, isValidElement, ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { descriptionKmFor } from "@/lib/i18n-descriptions";
import { toKhmerToolTitle } from "@/lib/tool-title-km";

/** Localises a shared UI string through the active-language dictionaries. */
function useUiText() {
  const { ui } = useLanguage();
  return (value?: string) => {
    if (!value) return value;
    return ui(value);
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
  return (
    <div className="mx-auto w-full max-w-6xl">
      <ShellHeader title={title} khmerTitle={khmerTitle} description={description} descriptionKm={descriptionKm} />
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function ShellHeader({ title, khmerTitle, description, descriptionKm }: { title: string; khmerTitle?: string; description: string; descriptionKm?: string }) {
  const { mode, ui } = useLanguage();
  const resolvedKhmerTitle = khmerTitle ?? toKhmerToolTitle(title);
  const localizedTitle = mode === "km" ? resolvedKhmerTitle : mode === "en" || mode === "bi" ? title : ui(title);
  const resolvedDescriptionKm = descriptionKm ?? descriptionKmFor(description);
  const localizedDescription =
    mode === "km"
      ? (resolvedDescriptionKm ?? description)
      : mode === "bi"
        ? (resolvedDescriptionKm ? `${description} / ${resolvedDescriptionKm}` : description)
        : mode === "en"
          ? description
          : ui(description);
  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">{localizedTitle}</h1>
        {mode === "bi" && resolvedKhmerTitle !== title && (
          <span lang="km" className="font-khmer text-lg text-[var(--gold)]">{resolvedKhmerTitle}</span>
        )}
      </div>
      <div aria-hidden className="mt-3 h-[3px] w-10 rounded-full bg-gradient-to-r from-[var(--gold)] to-transparent" />
      <p className="mt-3 text-sm leading-relaxed text-[var(--ink-dim)]">{localizedDescription}</p>
    </header>
  );
}

/**
 * Server-renderable stand-in shown while a tool's code downloads: the same header as ToolShell
 * (so the title is visible immediately and doesn't move when the tool arrives) plus a
 * fixed-height skeleton that reserves space and prevents the page from jumping.
 */
export function ToolShellPlaceholder({ title, khmerTitle, description, descriptionKm }: { title: string; khmerTitle?: string; description: string; descriptionKm?: string }) {
  const { text } = useLanguage();
  return (
    <div className="mx-auto w-full max-w-6xl" aria-busy="true">
      <ShellHeader title={title} khmerTitle={khmerTitle} description={description} descriptionKm={descriptionKm} />
      <div className="min-h-[55vh] space-y-4" role="status">
        <span className="sr-only">{text("Loading the tool…", "កំពុងផ្ទុកឧបករណ៍…")}</span>
        <div className="tool-skeleton h-11 rounded-md" />
        <div className="tool-skeleton h-28 rounded-md" />
        <div className="grid grid-cols-2 gap-3"><div className="tool-skeleton h-11 rounded-md" /><div className="tool-skeleton h-11 rounded-md" /></div>
        <div className="tool-skeleton h-20 rounded-md" />
      </div>
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
