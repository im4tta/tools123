"use client";

import { ArrowRight, Copy, Lightbulb, Share2, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { recommendationsFor } from "@/lib/recommendations";
import { toolHref } from "@/lib/toolRoutes";

export interface ResultCardData {
  label: string;
  value: string;
  detail?: string;
  tone?: "primary" | "default" | "muted";
}

export interface ResultGraphProps {
  primary: ResultCardData;
  related?: ResultCardData[];
  formula?: string;
  explanation?: string;
  relatedTools?: { id: string; label: string }[];
  toolId?: string;
  learning?: { example: string; check: string };
  onFavorite?: () => void;
}

function ResultCard({ card, primary = false }: { card: ResultCardData; primary?: boolean }) {
  const tone = card.tone ?? (primary ? "primary" : "default");
  return (
    <div className={`rounded-xl border p-4 ${
      tone === "primary"
        ? "border-[var(--gold)]/50 bg-[var(--gold)]/10"
        : tone === "muted"
          ? "border-[var(--ground-line)] bg-[var(--ground)]"
          : "border-[var(--ground-line)] bg-[var(--ground-raised)]"
    }`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{card.label}</p>
      <p className={`mt-1 break-words font-mono-ui font-bold ${primary ? "text-2xl text-[var(--gold)]" : "text-base text-[var(--ink)]"}`}>{card.value}</p>
      {card.detail && <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">{card.detail}</p>}
    </div>
  );
}

export function ResultGraph({ primary, related = [], formula, explanation, relatedTools, toolId, learning, onFavorite }: ResultGraphProps) {
  const { text: t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [learningMode, setLearningMode] = useState<"explain" | "formula" | "example" | "check" | null>(null);
  const recommendations = relatedTools ?? recommendationsFor(toolId ?? "").map((tool) => ({ id: tool.id, label: tool.reason }));

  const copyValue = () => {
    void navigator.clipboard.writeText(primary.value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    });
  };

  const share = () => {
    const payload = `${primary.label}: ${primary.value}${explanation ? `\n${explanation}` : ""}`;
    if (navigator.share) void navigator.share({ title: primary.label, text: payload });
    else void navigator.clipboard.writeText(payload);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <ResultCard card={primary} primary />
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={copyValue} className="rounded-lg border border-[var(--ground-line)] p-2 text-[var(--ink-faint)] hover:text-[var(--ink)]" title={t("Copy result", "ចម្លងលទ្ធផល")}><Copy size={14} /></button>
          <button type="button" onClick={share} className="rounded-lg border border-[var(--ground-line)] p-2 text-[var(--ink-faint)] hover:text-[var(--ink)]" title={t("Share result", "ចែករំលែកលទ្ធផល")}><Share2 size={14} /></button>
          {onFavorite && <button type="button" onClick={onFavorite} className="rounded-lg border border-[var(--ground-line)] p-2 text-[var(--ink-faint)] hover:text-[var(--gold)]" title={t("Favorite result", "រក្សាទុកលទ្ធផល")}><Star size={14} /></button>}
        </div>
      </div>
      {copied && <p className="-mt-2 text-right text-[10px] text-[var(--success)]">{t("Copied", "បានចម្លង")}</p>}
      {related.length > 0 && <div><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-faint)]">{t("Related values", "តម្លៃពាក់ព័ន្ធ")}</h3><div className="grid gap-2 sm:grid-cols-2">{related.map((card) => <ResultCard key={`${card.label}-${card.value}`} card={card} />)}</div></div>}
      {formula && <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{t("Formula", "រូបមន្ត")}</p><p className="mt-1 font-mono-ui text-sm text-[var(--ink)]">{formula}</p></div>}
      {explanation && <div className="rounded-xl border border-[var(--slate-accent)]/25 bg-[var(--slate-accent)]/10 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[var(--slate-accent)]">{t("Explanation", "ការពន្យល់")}</p><p className="mt-1 text-sm leading-relaxed text-[var(--ink-dim)]">{explanation}</p></div>}
      {learning && <div className="border-t border-[var(--ground-line)] pt-4"><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-faint)]"><Lightbulb size={14} className="text-[var(--gold)]" />{t("Learn from this result", "រៀនពីលទ្ធផលនេះ")}</div><div className="flex flex-wrap gap-2">{([["explain", "Explain", "ពន្យល់"], ["formula", "Show Formula", "បង្ហាញរូបមន្ត"], ["example", "Generate Example", "បង្កើតឧទាហរណ៍"], ["check", "Check My Answer", "ពិនិត្យចម្លើយ"]] as const).map(([key, label, labelKm]) => <button key={key} type="button" onClick={() => setLearningMode(key)} className="rounded-lg border border-[var(--ground-line)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-dim)] hover:border-[var(--gold-dim)] hover:text-[var(--gold)]">{t(label, labelKm)}</button>)}</div>{learningMode && <div className="mt-3 rounded-xl border border-[var(--gold)]/25 bg-[var(--gold)]/5 p-3 text-sm leading-relaxed text-[var(--ink-dim)]">{learningMode === "explain" && explanation}{learningMode === "formula" && (formula ?? "—")}{learningMode === "example" && learning.example}{learningMode === "check" && learning.check}</div>}</div>}
      {recommendations.length > 0 && <div><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-faint)]">{t("Related calculators", "ម៉ាស៊ីនគណនាពាក់ព័ន្ធ")}</h3><div className="flex flex-wrap gap-2">{recommendations.map((tool) => <Link key={tool.id} href={toolHref(tool.id)} className="inline-flex items-center gap-1 rounded-lg border border-[var(--ground-line)] px-3 py-2 text-xs font-semibold text-[var(--ink-dim)] hover:border-[var(--gold-dim)] hover:text-[var(--gold)]">{tool.label}<ArrowRight size={12} /></Link>)}</div></div>}
    </section>
  );
}
