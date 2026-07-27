"use client";

import { ReactNode } from "react";

export function ToolShell({
  title,
  khmerTitle,
  description,
  children,
}: {
  title: string;
  khmerTitle?: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">{title}</h1>
          {khmerTitle && (
            <span className="font-khmer text-lg text-[var(--gold)]">{khmerTitle}</span>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">{description}</p>
      </header>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
          {label}
        </span>
        {hint && <span className="text-xs text-[var(--ink-faint)]">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--gold-dim)] focus:ring-1 focus:ring-[var(--gold-dim)]";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${inputClass} font-mono-ui resize-y ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}
