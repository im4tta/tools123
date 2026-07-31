"use client";

import { useMemo, useState } from "react";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";
import { CATEGORY_META, CATEGORY_ORDER, TOOLS, type Category } from "@/lib/tools";
import { TOOL_RESIDENCY, type ResidencyKind } from "@/lib/tool-residency";

const RESIDENCY_ORDER: ResidencyKind[] = ["local", "external", "network"];

const KIND_META: Record<ResidencyKind, { label: string; labelKm: string; color: string }> = {
  local: { label: "Fully local", labelKm: "ដំណើរការក្នុងកុំព្យូទ័រ", color: "#3f9d63" },
  external: { label: "External links", labelKm: "តំណភ្ជាប់ខាងក្រៅ", color: "#d99a4e" },
  network: { label: "Network", labelKm: "បណ្តាញ", color: "#d9534f" },
};

type Filter = ResidencyKind | "all";

interface CategoryCounts {
  total: number;
  local: number;
  external: number;
  network: number;
}

function kindFor(id: string): ResidencyKind {
  return TOOL_RESIDENCY[id]?.kind ?? "local";
}

function countOf(c: CategoryCounts, kind: ResidencyKind) {
  return kind === "local" ? c.local : kind === "external" ? c.external : c.network;
}

export default function DataResidencyMap() {
  const { text } = useLanguage();
  const t = (en: string, km: string) => text(en, km);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<ReadonlySet<Category>>(new Set());

  const { byCategory, overall } = useMemo(() => {
    const byCategory = new Map<Category, CategoryCounts>();
    const overall = { total: 0, local: 0, external: 0, network: 0 } as CategoryCounts;
    for (const tool of TOOLS) {
      const kind = kindFor(tool.id);
      overall.total++;
      overall[kind]++;
      let entry = byCategory.get(tool.category);
      if (!entry) {
        entry = { total: 0, local: 0, external: 0, network: 0 };
        byCategory.set(tool.category, entry);
      }
      entry.total++;
      entry[kind]++;
    }
    return { byCategory, overall };
  }, []);

  const localPct = overall.total ? Math.round((overall.local / overall.total) * 100) : 0;

  const toggleCategory = (cat: Category) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const matchesQuery = (tool: { id: string; title: string; keywords: string[] }) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      tool.id.toLowerCase().includes(q) ||
      tool.title.toLowerCase().includes(q) ||
      tool.keywords.some((k) => k.toLowerCase().includes(q))
    );
  };

  const visibleTools = (cat: Category) =>
    TOOLS.filter((tool) => tool.category === cat && (filter === "all" || kindFor(tool.id) === filter) && matchesQuery(tool));

  const filterOptions: { value: Filter; label: string; labelKm: string }[] = [
    { value: "all", label: "All tools", labelKm: "ឧបករណ៍ទាំងអស់" },
    { value: "local", label: "Fully local", labelKm: "ដំណើរការក្នុងកុំព្យូទ័រ" },
    { value: "external", label: "External links", labelKm: "តំណភ្ជាប់ខាងក្រៅ" },
    { value: "network", label: "Network", labelKm: "បណ្តាញ" },
  ];

  return (
    <ToolShell
      title="Data Residency Map"
      description="A visual audit of the whole toolbox, generated from the tool registry and a static scan of each tool's source. It shows which tools run 100% on this device and which ones touch the network or open external sites."
      descriptionKm="ការត្រួតពិនិត្យមើលឃើញនូវឧបករណ៍ទាំងអស់ បង្កើតចេញពីបញ្ជីឧបករណ៍ និងការស្កេនកូដនៃឧបករណ៍នីមួយៗ។ បង្ហាញឧបករណ៍ណាដែលដំណើរការ ១០០% នៅក្នុងឧបករណ៍នេះ និងឧបករណ៍ណាដែលប៉ះបណ្តាញ ឬបើកគេហទំព័រខាងក្រៅ។"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {RESIDENCY_ORDER.map((kind) => (
          <button
            key={kind}
            onClick={() => setFilter(filter === kind ? "all" : kind)}
            className={`rounded-2xl border p-4 text-left transition ${
              filter === kind ? "border-[var(--gold)] ring-1 ring-[var(--gold-dim)]" : "border-[var(--ground-line)]"
            }`}
            aria-pressed={filter === kind}
          >
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: KIND_META[kind].color }} />
              {t(KIND_META[kind].label, KIND_META[kind].labelKm)}
            </div>
            <div className="mt-2 font-display text-3xl font-semibold text-[var(--ink)]">{countOf(overall, kind)}</div>
            <div className="mt-1 text-xs text-[var(--ink-faint)]">
              {kind === "local" && t("no network requests at all", "មិនមានសំណើបណ្តាញអ្វីទាំងអស់")}
              {kind === "external" && t("processing stays here; may open outbound links", "ដំណើរការក្នុងកុំព្យូទ័រ អាចបើកតំណខាងក្រៅ")}
              {kind === "network" && t("makes requests to function", "ធ្វើសំណើបណ្តាញដើម្បីដំណើរការ")}
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-[var(--ink)]">
            {t("Toolbox residency", "ទីតាំងទិន្នន័យឧបករណ៍")}
          </h2>
          <span className="text-xs text-[var(--ink-faint)]">
            {t(`${localPct}% fully local · ${overall.total} tools`, `ក្នុងស្រុក ១០០% ${localPct}% · ឧបករណ៍ ${overall.total}`)}
          </span>
        </div>
        <div className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-[var(--ground-line)]">
          {RESIDENCY_ORDER.filter((k) => countOf(overall, k) > 0).map((kind) => (
            <div
              key={kind}
              style={{ width: `${(countOf(overall, kind) / overall.total) * 100}%`, background: KIND_META[kind].color }}
              title={`${KIND_META[kind].label}: ${countOf(overall, kind)}`}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ink-dim)]">
          {RESIDENCY_ORDER.map((kind) => (
            <span key={kind} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: KIND_META[kind].color }} />
              {t(KIND_META[kind].label, KIND_META[kind].labelKm)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="inline-flex rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                filter === option.value ? "bg-[var(--gold)] text-[#0a0c0d]" : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
              }`}
            >
              {t(option.label, option.labelKm)}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Search a tool…", "ស្វែងរកឧបករណ៍…")}
          className="w-full rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--gold-dim)] sm:max-w-xs"
        />
      </div>

      <div className="space-y-2">
        {CATEGORY_ORDER.filter((cat) => byCategory.get(cat)).map((cat) => {
          const counts = byCategory.get(cat)!;
          const meta = CATEGORY_META[cat];
          const shown = visibleTools(cat);
          const isOpen = expanded.has(cat);
          return (
            <div key={cat} className="overflow-hidden rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)]">
              <button
                onClick={() => toggleCategory(cat)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
                aria-expanded={isOpen}
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: meta.color }} />
                <span className="truncate text-sm font-medium text-[var(--ink)]">
                  {t(meta.label, meta.khmer)}
                  <span className="ml-2 text-xs font-normal text-[var(--ink-faint)]">({counts.total})</span>
                </span>
                <span className="hidden flex-1 justify-end gap-1.5 sm:flex">
                  {RESIDENCY_ORDER.map((kind) =>
                    countOf(counts, kind) > 0 ? (
                      <span
                        key={kind}
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ background: `${KIND_META[kind].color}22`, color: KIND_META[kind].color }}
                      >
                        {countOf(counts, kind)}
                      </span>
                    ) : null
                  )}
                </span>
                <span className="w-28 shrink-0">
                  <span className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--ground-line)]">
                    {RESIDENCY_ORDER.map((kind) =>
                      countOf(counts, kind) > 0 ? (
                        <span
                          key={kind}
                          style={{ width: `${(countOf(counts, kind) / counts.total) * 100}%`, background: KIND_META[kind].color }}
                        />
                      ) : null
                    )}
                  </span>
                </span>
                <span className={`text-xs text-[var(--ink-faint)] transition-transform ${isOpen ? "rotate-90" : ""}`}>▸</span>
              </button>
              {isOpen && (
                <div className="max-h-80 overflow-auto border-t border-[var(--ground-line)] px-4 py-3">
                  {shown.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[var(--ink-faint)]">
                      {t("No tools match this filter.", "គ្មានឧបករណ៍ដែលត្រូវនឹងតម្រងនេះទេ។")}
                    </p>
                  ) : (
                    <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                      {shown.map((tool) => {
                        const kind = kindFor(tool.id);
                        return (
                          <li key={tool.id} className="flex items-center gap-2 text-xs text-[var(--ink-dim)]">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: KIND_META[kind].color }} />
                            <span className="truncate" title={tool.title}>
                              {tool.title}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-sm leading-relaxed text-[var(--ink-dim)]">
        <h2 className="mb-2 text-sm font-medium text-[var(--ink)]">{t("How this is computed", "របៀបគណនា")}</h2>
        <p>
          {t(
            "Every tool is classified by statically scanning its source: a network hit (fetch, XMLHttpRequest, WebSocket, EventSource, or a remote asset) wins and marks the tool Network; otherwise outbound references (external links, data URLs, Google Fonts imports) mark it External links; anything else is Fully local. Data-driven unit-pair converters are counted individually and run entirely on-device.",
            "ឧបករណ៍នីមួយៗត្រូវបានចាត់ថ្នាក់ដោយស្កេនកូដរបស់វា៖ ប្រសិនបើរកឃើញសំណើបណ្តាញ (fetch, XMLHttpRequest, WebSocket, EventSource ឬធនធានពីចម្ងាយ) ចាត់ជា Network។ បើមិនអញ្ចឹង តែមានតំណខាងក្រៅ ចាត់ជា External links។ នៅសល់ដោយគ្មានអ្វីទាំងអស់គឺ Fully local។ ឧបករណ៍បម្លែងឯកតាដែលបង្កើតដោយទិន្នន័យត្រូវបានរាប់រៀងៗខ្លួន ហើយដំណើរការក្នុងឧបករណ៍ទាំងស្រុង។"
          )}
        </p>
        <p className="mt-2">
          {t(
            "The map is regenerable: the audit script reads the tool registry, scans the component sources, and writes the data file. Run it after adding or changing any tool:",
            "ផែនទីនេះអាចបង្កើតឡើងវិញបាន៖ ស្គ្រីបស្កេនអានបញ្ជីឧបករណ៍ ស្កេនកូដធាតុផ្សំ រួចសរសេរឯកសារទិន្នន័យ។ ដំណើរការវាបន្ទាប់ពីបន្ថែម ឬកែឧបករណ៍ណាមួយ៖"
          )}
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 font-mono-ui text-xs text-[var(--ink)]">
          npm run audit:network
        </pre>
      </div>
    </ToolShell>
  );
}
