"use client";

import { ArrowRight, Command, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { routeIntent } from "@/lib/domain-router";
import { intentLabel, parseIntent } from "@/lib/intent-parser";
import { TOOLS } from "@/lib/tools";

export function UniversalInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { text: t } = useLanguage();
  const router = useRouter();
  const intent = useMemo(() => parseIntent(value), [value]);
  const route = useMemo(() => routeIntent(intent, value), [intent, value]);
  const tool = route ? TOOLS.find((item) => item.id === route.toolId) : null;

  function openTool() {
    if (route) router.push(route.href);
  }

  return (
    <section className="mx-auto mt-3 w-full max-w-md rounded-xl border border-[var(--gold)]/30 bg-[var(--ground-raised)] p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--gold)]">
        <Sparkles size={12} /> {t("Search or calculate", "ស្វែងរក ឬ គណនា")}
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-2.5 py-2 focus-within:border-[var(--gold-dim)]">
        <Command size={14} className="shrink-0 text-[var(--ink-faint)]" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && openTool()}
          placeholder={t(`Search ${TOOLS.length} tools or try 25% of 480…`, `ស្វែងរកឧបករណ៍ ${TOOLS.length} មុខ ឬសាកល្បង 25% នៃ 480…`)}
          className="min-w-0 flex-1 bg-transparent text-xs text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
          aria-label={t("Universal input", "បញ្ចូលសកល")}
        />
        <kbd className="hidden rounded border border-[var(--ground-line)] px-1.5 py-0.5 font-mono-ui text-[10px] text-[var(--ink-faint)] sm:block">Enter</kbd>
      </div>
      {value.trim() && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[var(--ink)]">{intentLabel(intent)}</p>
            <p className="truncate text-[10px] text-[var(--ink-faint)]">{intent.reason}{tool ? ` · ${t(tool.title, tool.khmerTitle ?? tool.title)}` : ""}</p>
          </div>
          {tool && <button type="button" onClick={openTool} className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[var(--gold)] px-2.5 py-1.5 text-[11px] font-bold text-[#0a0c0d] hover:bg-[var(--gold-dim)]"><ArrowRight size={12} /> {t("Open", "បើក")}</button>}
        </div>
      )}
    </section>
  );
}
