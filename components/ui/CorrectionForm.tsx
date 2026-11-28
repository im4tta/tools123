"use client";
// "Suggest a correction" for a glossary entry. The reader writes the fix, then opens a pre-filled public GitHub issue
// (lib/correction-report.ts). The site stores and sends nothing itself.
import { useId, useState } from "react";
import { ExternalLink, MessageSquareWarning } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { correctionIssueUrl, type CorrectionReport } from "@/lib/correction-report";

const STYLES = {
  lexicon: {
    toggle: "text-[var(--lx-ink-faint)] hover:text-[var(--lx-accent)]",
    box: "border-[var(--lx-line)] bg-[var(--lx-paper)]",
    field: "border-[var(--lx-line)] bg-[var(--lx-page)] text-[var(--lx-ink)] focus-visible:ring-[var(--lx-accent)]",
    label: "text-[var(--lx-ink-dim)]",
    hint: "text-[var(--lx-ink-faint)]",
    submit: "bg-[var(--lx-ink)] text-[var(--lx-paper)]",
  },
  hub: {
    toggle: "text-[var(--ink-faint)] hover:text-[var(--ink)]",
    box: "border-[var(--ground-line)] bg-[var(--ground)]",
    field: "border-[var(--ground-line-strong)] bg-[var(--ground-raised)] text-[var(--ink)] focus-visible:ring-[var(--focus)]",
    label: "text-[var(--ink-dim)]",
    hint: "text-[var(--ink-faint)]",
    submit: "bg-[var(--ink)] text-[var(--ground)]",
  },
} as const;

export function CorrectionForm({ report, variant }: { report: Omit<CorrectionReport, "suggestion" | "note">; variant: keyof typeof STYLES }) {
  const { text: t } = useLanguage();
  const id = useId();
  const s = STYLES[variant];
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [note, setNote] = useState("");
  const field = `mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 ${s.field}`;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`inline-flex items-center gap-1.5 text-xs underline-offset-4 hover:underline ${s.toggle}`}>
        <MessageSquareWarning size={14} aria-hidden />
        {t("Suggest a correction", "ស្នើការកែតម្រូវ")}
      </button>
    );
  }

  return (
    <div className={`rounded-xl border p-4 ${s.box}`}>
      <label htmlFor={`${id}-fix`} className={`block text-sm ${s.label}`}>
        {t("What should it say?", "តើវាគួរសរសេរដូចម្តេច?")}
      </label>
      <textarea id={`${id}-fix`} rows={2} value={suggestion} onChange={(e) => setSuggestion(e.target.value)} className={field} />
      <label htmlFor={`${id}-note`} className={`mt-3 block text-sm ${s.label}`}>
        {t("Where did you check it? (optional)", "តើអ្នកបានពិនិត្យនៅឯណា? (មិនចាំបាច់)")}
      </label>
      <input id={`${id}-note`} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("e.g. printed book, page 107", "ឧ. សៀវភៅបោះពុម្ព ទំព័រ ១០៧")} className={field} />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <a
          href={correctionIssueUrl({ ...report, suggestion, note })}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!suggestion.trim()}
          onClick={(e) => {
            if (!suggestion.trim()) e.preventDefault();
          }}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm aria-disabled:opacity-40 ${s.submit}`}
        >
          <ExternalLink size={14} aria-hidden />
          {t("Open report on GitHub", "បើករបាយការណ៍នៅលើ GitHub")}
        </a>
        <button type="button" onClick={() => setOpen(false)} className={`text-sm ${s.toggle}`}>
          {t("Cancel", "បោះបង់")}
        </button>
      </div>
      <p className={`mt-2 text-xs ${s.hint}`}>
        {t(
          "Opens a pre-filled public issue on GitHub (a GitHub account is needed). Nothing is sent until you submit it there.",
          "បើកបញ្ហាសាធារណៈដែលបានបំពេញជាមុននៅលើ GitHub (ត្រូវការគណនី GitHub)។ គ្មានអ្វីត្រូវបានផ្ញើទេ រហូតដល់អ្នកដាក់ស្នើនៅទីនោះ។",
        )}
      </p>
    </div>
  );
}
