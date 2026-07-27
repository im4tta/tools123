"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, ArrowRight } from "lucide-react";
import { TOOLS, CATEGORY_META, CATEGORY_ORDER } from "@/lib/tools";

const KH_DIGITS = "០១២៣៤៥៦៧៨៩";
const toKh = (n: number) => String(n).split("").map((d) => KH_DIGITS[Number(d)]).join("");

export function CommandPalette({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (id: string) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command loop className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-[var(--ground-line)] px-4 py-3">
            <Search size={16} className="text-[var(--ink-faint)]" />
            <Command.Input
              autoFocus
              placeholder={`Search ${TOOLS.length} instruments…`}
              className="w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
            />
            <kbd className="rounded border border-[var(--ground-line)] px-1.5 py-0.5 text-[10px] text-[var(--ink-faint)]">esc</kbd>
          </div>
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-[var(--ink-faint)]">
              No instrument matches.
            </Command.Empty>
            {CATEGORY_ORDER.map((cat) => (
              <Command.Group
                key={cat}
                heading={CATEGORY_META[cat].label}
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-[var(--ink-faint)]"
              >
                {TOOLS.filter((t) => t.category === cat).map((tool) => (
                  <Command.Item
                    key={tool.id}
                    value={`${tool.title} ${tool.keywords.join(" ")}`}
                    onSelect={() => {
                      onSelect(tool.id);
                      onOpenChange(false);
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-[var(--ink)] data-[selected=true]:bg-[var(--ground-line)]"
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: CATEGORY_META[cat].color }}
                      />
                      {tool.title}
                    </span>
                    <ArrowRight size={13} className="text-[var(--ink-faint)]" />
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
          <div className="flex items-center justify-between border-t border-[var(--ground-line)] px-4 py-2 text-[11px] text-[var(--ink-faint)]">
            <span>{toKh(TOOLS.length)} · {TOOLS.length} instruments total</span>
            <span>↑↓ navigate · ↵ open</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
