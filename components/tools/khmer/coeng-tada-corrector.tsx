"use client";

import { Check, Copy, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

type CtdaModule = {
  _ctda_init: () => number;
  _ctda_correct: (pointer: number) => number;
  _ctda_predict_json: (pointer: number) => number;
  _ctda_free: (pointer: number) => void;
  _malloc: (size: number) => number;
  _free: (pointer: number) => void;
  lengthBytesUTF8: (value: string) => number;
  stringToUTF8: (value: string, pointer: number, size: number) => void;
  UTF8ToString: (pointer: number) => string;
};

declare global {
  interface Window { createCtda?: (options?: { locateFile?: (path: string) => string }) => Promise<CtdaModule>; }
}

const MODEL_SCRIPT = "/vendor/coengtada/ctda.js";
const DEFAULT_INPUT = "គ្របដណ្តប់លើផ្ទៃដី និងស្តីពីស្ថានភាពធាតុអាកាស។";

function callString(module: CtdaModule, fn: (pointer: number) => number, text: string) {
  const size = module.lengthBytesUTF8(text) + 1;
  const inputPointer = module._malloc(size);
  module.stringToUTF8(text, inputPointer, size);
  const outputPointer = fn(inputPointer);
  const output = module.UTF8ToString(outputPointer);
  module._free(inputPointer);
  module._ctda_free(outputPointer);
  return output;
}

function highlightedText(text: string, sites: [number, number][], reference: string, output: boolean, showCodepoints = false) {
  const marked = new Map(sites.map(([index, probability]) => [index, probability]));
  const referenceCharacters = [...reference];
  const segments = [...new Intl.Segmenter("km", { granularity: "grapheme" }).segment(text)];
  let codepointIndex = 0;
  const rendered = segments.map(({ segment }) => {
    const segmentStart = codepointIndex;
    codepointIndex += [...segment].length;
    const probability = [...marked.entries()].find(([index]) => index >= segmentStart && index < codepointIndex)?.[1];
    if (probability === undefined) return <Fragment key={`${segment}-${segmentStart}`}>{segment}</Fragment>;
    const referenceSegment = referenceCharacters.slice(segmentStart, codepointIndex).join("");
    const changed = output && segment !== referenceSegment;
    return <mark key={`${segment}-${segmentStart}`} title={`P(ដ) = ${probability.toFixed(3)}`} className={`rounded px-0.5 ${changed ? "bg-[var(--success)]/30 text-[var(--success)]" : "bg-[var(--gold)]/30 text-[var(--gold)]"}`}>{segment}</mark>;
  });
  return <>{rendered}{showCodepoints && <div className="mt-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">Input code points</p><div className="flex flex-wrap gap-1">{[...text].map((character, index) => { const predicted = marked.has(index); const correct = predicted && referenceCharacters[index] === character; const codepoint = character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0"); return <span key={`${character}-${index}`} title={character} className={`inline-flex min-w-10 flex-col items-center rounded border px-1 py-1 ${correct ? "border-[var(--success)] bg-[var(--success)]/20 text-[var(--success)]" : predicted ? "border-[var(--gold)] bg-[var(--gold)]/20 text-[var(--gold)]" : "border-[var(--ground-line)] bg-[var(--ground)] text-[var(--ink-faint)]"}`}><span className="font-khmer text-sm">{character === " " ? "·" : character}</span><span className="font-mono-ui text-[8px]">U+{codepoint}</span></span>; })}</div></div>}</>;
}

export default function CoengTadaCorrector() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("coeng-tada-corrector:input", DEFAULT_INPUT);
  const [module, setModule] = useState<CtdaModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [corrected, setCorrected] = useState("");
  const [sites, setSites] = useState<[number, number][]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const existing = document.querySelector(`script[src="${MODEL_SCRIPT}"]`);
    const script = existing ?? document.createElement("script");
    let cancelled = false;
    const ready = existing ? Promise.resolve() : new Promise<void>((resolve, reject) => {
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener("error", () => reject(new Error("Could not load the Coeng Ta/Da WASM model.")), { once: true });
      script.setAttribute("src", MODEL_SCRIPT);
      document.head.appendChild(script);
    });
    void ready.then(async () => {
      if (!window.createCtda) throw new Error("The Coeng Ta/Da model API is unavailable.");
      const instance = await window.createCtda({ locateFile: (path) => `/vendor/coengtada/${path}` });
      if (!instance._ctda_init()) throw new Error("The Coeng Ta/Da model could not initialize.");
      if (!cancelled) { setModule(instance); setLoading(false); }
    }).catch((cause: unknown) => { if (!cancelled) { setError(cause instanceof Error ? cause.message : "Model loading failed."); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!module || !input.trim()) return;
    let cancelled = false;
    try {
      const nextCorrected = callString(module, module._ctda_correct, input);
      const nextSites = JSON.parse(callString(module, module._ctda_predict_json, input)) as [number, number][];
      window.setTimeout(() => { if (!cancelled) { setCorrected(nextCorrected); setSites(nextSites); } }, 0);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Correction failed.";
      window.setTimeout(() => { if (!cancelled) setError(message); }, 0);
    }
    return () => { cancelled = true; };
  }, [input, module]);

  function copyCorrected() {
    void navigator.clipboard.writeText(corrected).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1400); });
  }

  const changed = [...input].filter((character, index) => character !== [...corrected][index]).length;
  return <ToolShell title="Khmer Coeng Ta/Da Corrector" khmerTitle="កែសម្រួលជើង ត / ជើង ដ" description="Detect and correct Khmer Coeng Ta/Da typing ambiguity using the original MIT-licensed browser WASM work by Seanghay Yath." descriptionKm="រកឃើញ និងកែសម្រួលភាពច្រឡំក្នុងការវាយជើង ត / ជើង ដ ដោយប្រើស្នាដៃ WASM ដើមរបស់ Seanghay Yath ដែលមានអាជ្ញាបណ្ណ MIT។">
    <div className="space-y-5">
      <section className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]"><Sparkles size={16} className="text-[var(--gold)]" />{t("Paste Khmer text", "បិទភ្ជាប់អត្ថបទខ្មែរ")}</div><TextArea rows={5} value={input} onChange={(event) => { setInput(event.target.value); if (!event.target.value.trim()) { setCorrected(""); setSites([]); } }} className="font-khmer text-lg leading-relaxed" placeholder={t("Type Khmer text here…", "វាយអត្ថបទខ្មែរនៅទីនេះ…")} />{loading && <p className="mt-3 flex items-center gap-2 text-xs text-[var(--ink-dim)]"><Loader2 size={14} className="animate-spin" />{t("Loading local correction model…", "កំពុងបើកម៉ូដែលកែសម្រួលក្នុងឧបករណ៍…")}</p>}{error && <p className="mt-3 text-xs text-[var(--danger)]">{error}</p>}</section>
      {corrected && <><section className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><h2 className="mb-2 font-display text-lg font-semibold text-[var(--ink)]">{t("Detected sites in original text", "ចំណុចដែលរកឃើញក្នុងអត្ថបទដើម")}</h2><p className="font-khmer text-lg leading-loose text-[var(--ink)]">{highlightedText(input, sites, corrected, false, true)}</p></section><section className="rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-4"><div className="mb-2 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold text-[var(--ink)]">{t("Corrected text", "អត្ថបទដែលបានកែសម្រួល")}</h2><button type="button" onClick={copyCorrected} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ground-line)] px-2.5 py-1.5 text-xs text-[var(--ink-dim)]">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? t("Copied", "បានចម្លង") : t("Copy", "ចម្លង")}</button></div><p className="font-khmer text-lg leading-loose text-[var(--ink)]">{highlightedText(corrected, sites, input, true)}</p><div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--ink-faint)]"><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded bg-[var(--gold)]/40" />{t("Predicted site", "ចំណុចដែលបានព្យាករ")}</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded bg-[var(--success)]/40" />{t("Changed", "បានកែប្រែ")}</span></div><p className="mt-3 text-xs text-[var(--ink-faint)]">{t(`${sites.length} ambiguous site(s), ${changed} changed`, `រកឃើញចំណុចមិនច្បាស់ ${sites.length} កន្លែង កែប្រែ ${changed} កន្លែង`)}</p></section></>}
      {sites.length > 0 && <section className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><h2 className="mb-2 font-semibold text-[var(--ink)]">{t("Predicted Coeng sites", "ចំណុចជើងដែលបានព្យាករ")}</h2><div className="flex flex-wrap gap-2">{sites.map(([index, probability]) => <span key={`${index}-${probability}`} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-2.5 py-1.5 font-mono-ui text-xs text-[var(--ink-dim)]">#{index} · P(ដ) {probability.toFixed(3)}</span>)}</div></section>}
      <aside className="rounded-xl border border-[var(--gold)]/25 bg-[var(--gold)]/5 p-4 text-xs leading-relaxed text-[var(--ink-dim)]"><p className="font-semibold text-[var(--ink)]">{t("Original work, attribution, and license", "ស្នាដៃដើម ការទទួលស្គាល់ និងអាជ្ញាបណ្ណ")}</p><p className="mt-1">{t("This tool uses the original browser WASM work by Mr. Seanghay Yath. It is not an independent reimplementation. The model predicts context; review suggested changes before publishing.", "ឧបករណ៍នេះប្រើស្នាដៃ WASM ក្នុងកម្មវិធីរុករកដើមរបស់លោក Seanghay Yath។ វាមិនមែនជាការអនុវត្តឡើងវិញដោយឯករាជ្យទេ។ ម៉ូដែលព្យាករតាមបរិបទ សូមពិនិត្យការកែសម្រួលមុនបោះពុម្ពផ្សាយ។")}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1"><a href="https://github.com/seanghay/khmer-coeng-tada-corrector" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--gold)] underline"><ExternalLink size={12} />{t("Source repository", "ឃ្លាំងកូដដើម")}</a><a href="https://khmer-coeng-tada-corrector.vercel.app/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--gold)] underline"><ExternalLink size={12} />{t("Original demo", "Demo ដើម")}</a></div><p className="mt-2">{t("Copyright © 2026 Seanghay Yath · MIT License", "រក្សាសិទ្ធិ © ២០២៦ Seanghay Yath · អាជ្ញាបណ្ណ MIT")}</p></aside>
    </div>
  </ToolShell>;
}
