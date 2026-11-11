"use client";

import { ArrowRight, Command, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { routeIntent } from "@/lib/domain-router";
import { intentLabel, parseIntent } from "@/lib/intent-parser";
import { toKhmerNumerals } from "@/lib/khmer-number-words";
import { TOOLS } from "@/lib/tools";
import { preferredScrollBehavior } from "@/lib/use-reduced-motion";

export function UniversalInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { text: t } = useLanguage();
  const router = useRouter();
  const intent = useMemo(() => parseIntent(value), [value]);
  const route = useMemo(() => routeIntent(intent, value), [intent, value]);
  const tool = route ? TOOLS.find((item) => item.id === route.toolId) : null;

  function openTool() {
    if (route) router.push(route.href);
  }

  /** Search button / Enter: open the detected calculation, else jump to the filtered results. */
  function submit() {
    if (route) openTool();
    else document.getElementById("tool-results")?.scrollIntoView({ behavior: preferredScrollBehavior(), block: "start" });
  }

  return (
    <section className="mx-auto mt-3 w-full max-w-md rounded-xl border border-[var(--gold)]/30 bg-[var(--ground-raised)] p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--gold-text)]">
        <Sparkles size={12} /> {t("Search or calculate", "ស្វែងរក ឬ គណនា")}
      </div>
      <div data-focus-ring="within" className="flex items-center gap-2 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-2.5 py-2 focus-within:border-[var(--gold-dim)]">
        <Command size={14} className="shrink-0 text-[var(--ink-faint)]" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && submit()}
          placeholder={t(`Search ${TOOLS.length} tools or try 25% of 480…`, `ស្វែងរកឧបករណ៍ ${toKhmerNumerals(String(TOOLS.length))} មុខ ឬសាកល្បង 25% នៃ 480…`)}
          className="min-w-0 flex-1 bg-transparent text-xs text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
          aria-label={t("Universal input", "បញ្ចូលសកល")}
        />
        <button type="button" onClick={submit} className="shrink-0 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[var(--on-gold)] hover:bg-[var(--gold-hover)]">
          {t("Search", "ស្វែងរក")}
        </button>
      </div>
      {value.trim() && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[var(--ink)]">{intentLabel(intent)}</p>
            <p className="truncate text-[10px] text-[var(--ink-faint)]">{intent.reason}{tool ? ` · ${t(tool.title, tool.khmerTitle ?? tool.title)}` : ""}</p>
          </div>
          {tool && <button type="button" onClick={openTool} className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[var(--gold)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--on-gold)] hover:bg-[var(--gold-hover)]"><ArrowRight size={12} /> {t("Open", "បើក")}</button>}
        </div>
      )}
    </section>
  );
}
