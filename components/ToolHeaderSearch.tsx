"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { TOOLS } from "@/lib/tools";
import { toolHref } from "@/lib/toolRoutes";

const KH_DIGITS = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number) => String(n).split("").map((d) => KH_DIGITS[Number(d)]).join("");

const MAX_RESULTS = 10;

/**
 * Header search box shown on a tool page. It opens pre-filled with the current
 * tool's name, and can be edited to jump straight to another tool — the same
 * catalogue the command palette (⌘K) searches, inline in the header.
 *
 * The parent re-keys this component on the localized title, so navigating to a
 * new tool or toggling the language remounts it fresh with the new name.
 */
export function ToolHeaderSearch({ currentToolId, label }: { currentToolId: string; label: string }) {
  const { text: t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState(label);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const isDefault = query.trim() === label.trim() || query.trim() === "";

  const results = useMemo(() => {
    if (isDefault) return [] as typeof TOOLS;
    const q = query.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      const hay = [tool.title, tool.khmerTitle ?? "", ...tool.keywords].join(" ").toLowerCase();
      return hay.includes(q);
    }).slice(0, MAX_RESULTS);
  }, [query, isDefault]);

  const reset = useCallback(() => {
    setOpen(false);
    setQuery(label);
    inputRef.current?.blur();
  }, [label]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) reset();
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, reset]);

  function go(id: string) {
    setOpen(false);
    if (id === currentToolId) {
      setQuery(label);
      inputRef.current?.blur();
      return;
    }
    router.push(toolHref(id));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      reset();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      if (results.length) setHighlight((h) => (h + 1) % results.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length) setHighlight((h) => (h - 1 + results.length) % results.length);
      return;
    }
    if (event.key === "Enter") {
      const target = results[highlight];
      if (target) {
        event.preventDefault();
        go(target.id);
      }
    }
  }

  return (
    <div ref={containerRef} className="tool-route-search relative min-w-0 flex-1">
      <div className="flex items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1.5 focus-within:border-[var(--gold-dim)]">
        <Search size={13} className="shrink-0 text-[var(--ink-faint)]" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          role="combobox"
          aria-expanded={open && !isDefault}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={t("Search tools", "ស្វែងរកឧបករណ៍")}
          title={t("Search tools — type to jump to another tool", "ស្វែងរកឧបករណ៍ — វាយបញ្ចូលដើម្បីលោតទៅឧបករណ៍ផ្សេង")}
          placeholder={t(`Search ${TOOLS.length} tools…`, `ស្វែងរកឧបករណ៍ ${toKh(TOOLS.length)} មុខ…`)}
          spellCheck={false}
          autoComplete="off"
          onFocus={(event) => {
            event.target.select();
            setOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlight(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-xs font-medium text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
        />
      </div>
      {open && (
        <div
          id={listId}
          className="tool-route-search-pop absolute left-0 top-[calc(100%+6px)] z-50 w-[min(24rem,80vw)] overflow-hidden rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] shadow-2xl"
        >
          {isDefault ? (
            <p className="px-3 py-2.5 text-xs text-[var(--ink-faint)]">
              {t(`Type to search all ${TOOLS.length} tools…`, `វាយបញ្ចូលដើម្បីស្វែងរកឧបករណ៍ទាំង ${toKh(TOOLS.length)} មុខ…`)}
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-[var(--ink-faint)]">
              {t("No matching tool found.", "រកមិនឃើញឧបករណ៍ដែលត្រូវនឹងការស្វែងរកទេ។")}
            </p>
          ) : (
            <ul role="listbox" aria-label={t("Tools", "ឧបករណ៍")} className="max-h-[60vh] overflow-y-auto p-1.5">
              {results.map((tool, index) => (
                <li key={tool.id} role="option" aria-selected={index === highlight}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => go(tool.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition ${
                      index === highlight ? "bg-[var(--ground-line)] text-[var(--ink)]" : "text-[var(--ink-dim)]"
                    } ${tool.id === currentToolId ? "opacity-60" : ""}`}
                  >
                    <span className="truncate">{t(tool.title, tool.khmerTitle ?? tool.title)}</span>
                    {tool.id === currentToolId && (
                      <span className="ml-auto shrink-0 text-[10px] text-[var(--ink-faint)]">{t("current", "បច្ចុប្បន្ន")}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
