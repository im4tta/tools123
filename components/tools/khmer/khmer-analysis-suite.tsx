"use client";

import { useMemo, useState } from "react";
import { Copy, Download, Languages } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { MPTC_TERMS } from "@/lib/data/mptc-lexicon";
import { STATIC_DATABASE } from "@/lib/khmer-lexicon-db";
import { CAMBODIA_PLACE_VARIANTS } from "@/lib/cambodia-place-variants";

export type KhmerSuiteMode = "coverage" | "document" | "dataset" | "places" | "font" | "font-regression" | "relationships";

function khmerCount(value: string) { return [...value].filter((c) => /[\u1780-\u17ff]/.test(c)).length; }

function normalizePlace(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[\s._\-']/g, "");
}

function levenshtein(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = a[i - 1] === b[j - 1] ? previous : Math.min(previous + 1, row[j - 1] + 1, current + 1);
      previous = current;
    }
  }
  return row[b.length];
}

function matchPlace(raw: string) {
  const input = normalizePlace(raw);
  let best: { province: typeof CAMBODIA_PLACE_VARIANTS[number]; score: number; matchType: string } | null = null;
  for (const province of CAMBODIA_PLACE_VARIANTS) {
    for (const variant of [province.en, province.km, province.code, ...province.variants]) {
      const candidate = normalizePlace(variant);
      if (candidate === input) return { province, score: 100, matchType: "Exact" };
      if (candidate.length <= 3 || input.length <= 3) continue;
      const similarity = ((Math.max(candidate.length, input.length) - levenshtein(candidate, input)) / Math.max(candidate.length, input.length)) * 100;
      const score = candidate.includes(input) || input.includes(candidate) ? 85 : Math.round(similarity);
      if (score >= 65 && (!best || score > best.score)) best = { province, score, matchType: score >= 85 ? "High confidence" : "Fuzzy match" };
    }
  }
  return best ?? { province: null, score: 0, matchType: "Unmatched" };
}

export function KhmerAnalysisSuite({ mode }: { mode: KhmerSuiteMode }) {
  const { text: t } = useLanguage();
  const [input, setInput] = useState("");
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [fontInfo, setFontInfo] = useState<string[]>([]);
  const [fontResults, setFontResults] = useState<{ name: string; family: string; supported: number; missing: string[]; sample: string }[]>([]);

  const report = useMemo(() => {
    if (mode === "coverage" || mode === "document") {
      const hits = MPTC_TERMS.filter((term) => input.includes(term.km) || term.en.toLowerCase().split(/\s+/).some((word) => word.length > 3 && input.toLowerCase().includes(word))).slice(0, 100);
      return { hits, stats: `${hits.length} terminology matches · ${khmerCount(input)} Khmer characters` };
    }
    if (mode === "dataset") {
      try {
        const parsed = input.trim().startsWith("[") ? JSON.parse(input) : input.trim().split(/\r?\n/).map((line) => line.split(","));
        const rows = Array.isArray(parsed) ? parsed : [parsed];
        const text = JSON.stringify(rows);
        const duplicates = rows.length - new Set(rows.map((row) => JSON.stringify(row))).size;
        return { hits: [], stats: `${rows.length} rows · ${khmerCount(text)} Khmer characters · ${duplicates} duplicate rows` };
      } catch { return { hits: [], stats: "Invalid JSON or CSV input" }; }
    }
    if (mode === "places") {
      const terms = input.split(/\r?\n|,/).map((v) => v.trim()).filter(Boolean);
      const matches = terms.map((term) => ({ term, ...matchPlace(term) }));
      const groups = [...new Map(matches.map((match) => [match.province?.code ?? `unknown:${normalizePlace(match.term)}`, [] as typeof matches])).entries()].map(([key, variants]) => ({ key, variants }));
      matches.forEach((match) => groups.find((group) => group.key === (match.province?.code ?? `unknown:${normalizePlace(match.term)}`))?.variants.push(match));
      const placeGroups = groups.map((group) => ({ ...group, province: group.variants[0]?.province, confidence: Math.max(...group.variants.map((variant) => variant.score)) }));
      return { hits: placeGroups, stats: `${terms.length} names · ${placeGroups.length} probable places · ${placeGroups.filter((g) => g.province).length} recognized provinces` };
    }
    if (mode === "relationships") {
      const terms = input.split(/[\s,]+/).filter(Boolean).slice(0, 20);
      return { hits: terms.map((term) => ({ term, entry: STATIC_DATABASE[term] })), stats: `${terms.length} words · ${terms.filter((term) => STATIC_DATABASE[term]).length} dictionary nodes` };
    }
    return { hits: [], stats: fileNames.length ? `${fileNames.length} font file(s) selected` : "Select one or two font files" };
  }, [fileNames.length, input, mode]);

  const meta = {
    coverage: ["Khmer Terminology Coverage Checker", "ពិនិត្យការគ្របដណ្តប់ពាក្យបច្ចេកទេសខ្មែរ"],
    document: ["Khmer Document Terminology Scanner", "ស្កេនពាក្យបច្ចេកទេសក្នុងឯកសារ"],
    dataset: ["Khmer Dataset Profiler", "វិភាគគុណភាព Dataset ខ្មែរ"],
    places: ["Cambodia Place-Name Variant Finder", "ស្វែងរកបំរែបំរួលឈ្មោះទីកន្លែងកម្ពុជា"],
    font: ["Khmer Font Coverage Analyzer", "វិភាគការគាំទ្រអក្សរខ្មែរ ក្នុង Font"],
    "font-regression": ["Khmer Font Regression Tester", "ប្រៀបធៀប Font ខ្មែរ"],
    relationships: ["Khmer Word Relationship Explorer", "ស្វែងរកទំនាក់ទំនងពាក្យខ្មែរ"],
  }[mode];

  function files(files: FileList | null) {
    if (!files) return;
    const selected = [...files].slice(0, 2);
    setFileNames(selected.map((f) => f.name));
    if (mode === "font" || mode === "font-regression") {
      const sample = "កខគឃងចឆជឈញដណតថទធនបផពភមយរលវសហឡា ាំ ើ ឿ េះ ្មែរ";
      Promise.all(selected.map(async (file, index) => {
        const family = `KhmerUpload${Date.now()}${index}`;
        const url = URL.createObjectURL(file);
        const face = new FontFace(family, `url(${url})`);
        await face.load();
        document.fonts.add(face);
        const chars = [...sample];
        const supported = chars.filter((char) => document.fonts.check(`32px "${family}"`, char)).length;
        URL.revokeObjectURL(url);
        return { name: file.name, family, supported, missing: chars.filter((char) => !document.fonts.check(`32px "${family}"`, char)), sample };
      })).then((results) => {
        setFontResults(results);
        setFontInfo(results.map((result) => `${result.name}: ${result.supported}/${[...result.sample].length} sample glyphs detected`));
      }).catch(() => setFontInfo([t("Could not load one or more fonts.", "មិនអាចបើក Font មួយ ឬច្រើនបានទេ។")]));
    } else {
      selected[0]?.text().then(setInput);
    }
  }

  function placeRows() {
    return report.hits as { key: string; variants: { term: string; score: number; matchType: string }[]; province: typeof CAMBODIA_PLACE_VARIANTS[number] | null; confidence: number }[];
  }

  async function copyPlaceResults() {
    const rows = placeRows().flatMap((group) => group.variants.map((variant) => [variant.term, group.province?.en ?? "", group.province?.km ?? "", group.province?.code ?? "", `${variant.score}%`, variant.matchType].join("\t")));
    await navigator.clipboard.writeText(["Original\tProvince EN\tProvince KH\tCode\tConfidence\tMatch Type", ...rows].join("\n"));
  }

  function exportPlaceResults() {
    const rows = placeRows().flatMap((group) => group.variants.map((variant) => [variant.term, group.province?.en ?? "", group.province?.km ?? "", group.province?.code ?? "", `${variant.score}%`, variant.matchType]));
    const csv = ["Original Input,Province EN,Province KH,Code,Confidence,Match Type", ...rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,\uFEFF${encodeURIComponent(csv)}`;
    link.download = "cambodia_place_name_variants.csv";
    link.click();
  }

  return <ToolShell title={meta[0]} khmerTitle={meta[1]} description="Local-first Khmer language quality and terminology analysis." descriptionKm="ឧបករណ៍វិភាគភាសាខ្មែរ ដំណើរការក្នុងកម្មវិធីរុករករបស់អ្នក។">
    <div className="space-y-5">
      {mode === "font" || mode === "font-regression" ? <input type="file" accept=".ttf,.otf,.woff,.woff2" multiple onChange={(e) => files(e.target.files)} className="block w-full rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-sm text-[var(--ink)]" /> : <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "places" ? "One place name per line…" : "Paste Khmer text, CSV, or JSON…"} className="h-48 w-full rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4 font-mono-ui text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />}
      {fontInfo.length > 0 && <div className="space-y-3 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-3 text-xs text-[var(--ink-dim)]">
        {fontInfo.map((line) => <div key={line}>{line}</div>)}
        {fontResults.length > 0 && <div className={`grid gap-3 ${mode === "font-regression" ? "sm:grid-cols-2" : "grid-cols-1"}`}>
          {fontResults.map((font) => <div key={font.family} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="font-semibold text-[var(--ink)]">{font.name}</div>
            <div className="mt-1 font-mono-ui text-xs text-[var(--gold)]">{font.supported}/{[...font.sample].length} sample glyphs</div>
            <div className="mt-2 font-khmer text-lg text-[var(--ink)]" style={{ fontFamily: `"${font.family}"` }}>{font.sample}</div>
            {font.missing.length > 0 && <div className="mt-2 text-[10px] text-[var(--danger)]">{t("Missing sample glyphs:", "អក្សរគំរូដែលខ្វះ:")} {font.missing.join(" ")}</div>}
          </div>)}
        </div>}
      </div>}
      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--ink)]"><Languages size={15} className="text-[var(--gold)]" /><span>{report.stats}</span>{mode === "places" && input.trim() && <span className="ml-auto flex gap-1.5"><button type="button" onClick={copyPlaceResults} className="flex items-center gap-1 rounded-md border border-[var(--ground-line)] px-2 py-1 text-[11px] text-[var(--ink-dim)] hover:text-[var(--ink)]"><Copy size={11} />Copy</button><button type="button" onClick={exportPlaceResults} className="flex items-center gap-1 rounded-md border border-[var(--gold)]/30 px-2 py-1 text-[11px] text-[var(--gold)] hover:bg-[var(--gold)]/10"><Download size={11} />CSV</button></span>}</div>
        {(mode === "coverage" || mode === "document") && <div className="grid gap-2 sm:grid-cols-2">{(report.hits as typeof MPTC_TERMS).map((term) => <div key={`${term.km}-${term.en}`} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-3"><div className="font-khmer font-bold text-[var(--ink)]">{term.km}</div><div className="text-xs text-[var(--gold)]">{term.en}</div><p className="mt-1 text-xs text-[var(--ink-dim)]">{term.def}</p></div>)}</div>}
        {mode === "places" && <div className="space-y-3">{(report.hits as { key: string; variants: { term: string; score: number; matchType: string }[]; province: typeof CAMBODIA_PLACE_VARIANTS[number] | null; confidence: number }[]).map((group) => <div key={group.key} className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4"><div className="flex items-center justify-between gap-3"><div><div className="font-semibold text-[var(--ink)]">{group.province ? `${group.province.km} · ${group.province.en}` : "Possible same place"}</div><div className="text-[10px] text-[var(--ink-faint)]">{group.province ? group.province.code : "Unmatched variant group"}</div></div><span className="font-mono-ui text-sm font-bold text-[var(--success)]">{group.confidence}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--ground-line)]"><div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${group.confidence}%` }} /></div><div className="mt-3 flex flex-wrap gap-1.5">{group.variants.map((variant) => <span key={variant.term} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1 font-khmer text-xs text-[var(--ink-dim)]">{variant.term}</span>)}</div></div>)}</div>}
        {mode === "relationships" && <div className="grid gap-2 sm:grid-cols-2">{(report.hits as { term: string; entry: typeof STATIC_DATABASE[string] | undefined }[]).map((node) => <div key={node.term} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-3"><div className="font-khmer font-bold text-[var(--gold)]">{node.term}</div><div className="mt-1 text-xs text-[var(--ink-dim)]">{node.entry ? `${node.entry.definition} · ${node.entry.synonyms.join(", ")}` : "No dictionary node found"}</div></div>)}</div>}
        {(mode === "font" || mode === "font-regression") && <p className="text-xs leading-relaxed text-[var(--ink-dim)]">{t("Font files are loaded locally and tested against a Khmer sample set. A font fallback can affect browser coverage checks, so use the visual comparison together with the counts.", "Font ត្រូវបានបើកក្នុង Browser ជាមូលដ្ឋាន។ ប្រព័ន្ធសាកល្បងជាមួយសំណុំអក្សរខ្មែរ ហើយបង្ហាញការប្រៀបធៀបដោយមើលឃើញ។")}</p>}
      </div>
    </div>
  </ToolShell>;
}
