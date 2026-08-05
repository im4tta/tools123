"use client";

import { Check, Copy, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
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
  return <ToolShell title="Khmer Coeng Ta/Da Corrector" khmerTitle="កែសម្រួលជើង តា / ជើង ដា" description="Detect and correct Khmer Coeng Ta/Da typing ambiguity using Seanghay Yath's MIT-licensed browser WASM model." descriptionKm="រកឃើញ និងកែសម្រួលភាពច្រឡំក្នុងការវាយជើង តា / ជើង ដា ដោយប្រើ WASM ក្នុងកម្មវិធីរុករករបស់ Seanghay Yath ដែលមានអាជ្ញាបណ្ណ MIT។">
    <div className="space-y-5">
      <section className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]"><Sparkles size={16} className="text-[var(--gold)]" />{t("Paste Khmer text", "បិទភ្ជាប់អត្ថបទខ្មែរ")}</div><TextArea rows={5} value={input} onChange={(event) => { setInput(event.target.value); if (!event.target.value.trim()) { setCorrected(""); setSites([]); } }} className="font-khmer text-lg leading-relaxed" placeholder={t("Type Khmer text here…", "វាយអត្ថបទខ្មែរនៅទីនេះ…")} />{loading && <p className="mt-3 flex items-center gap-2 text-xs text-[var(--ink-dim)]"><Loader2 size={14} className="animate-spin" />{t("Loading local correction model…", "កំពុងបើកម៉ូដែលកែសម្រួលក្នុងឧបករណ៍…")}</p>}{error && <p className="mt-3 text-xs text-[var(--danger)]">{error}</p>}</section>
      {corrected && <section className="rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/5 p-4"><div className="mb-2 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold text-[var(--ink)]">{t("Corrected text", "អត្ថបទដែលបានកែសម្រួល")}</h2><button type="button" onClick={copyCorrected} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ground-line)] px-2.5 py-1.5 text-xs text-[var(--ink-dim)]">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? t("Copied", "បានចម្លង") : t("Copy", "ចម្លង")}</button></div><p className="font-khmer text-lg leading-loose text-[var(--ink)]">{corrected}</p><p className="mt-3 text-xs text-[var(--ink-faint)]">{t(`${sites.length} ambiguous site(s), ${changed} changed`, `រកឃើញចំណុចមិនច្បាស់ ${sites.length} កន្លែង កែប្រែ ${changed} កន្លែង`)}</p></section>}
      {sites.length > 0 && <section className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4"><h2 className="mb-2 font-semibold text-[var(--ink)]">{t("Predicted Coeng sites", "ចំណុចជើងដែលបានព្យាករ")}</h2><div className="flex flex-wrap gap-2">{sites.map(([index, probability]) => <span key={`${index}-${probability}`} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-2.5 py-1.5 font-mono-ui text-xs text-[var(--ink-dim)]">#{index} · P(ដ) {probability.toFixed(3)}</span>)}</div></section>}
      <aside className="rounded-xl border border-[var(--gold)]/25 bg-[var(--gold)]/5 p-4 text-xs leading-relaxed text-[var(--ink-dim)]"><p className="font-semibold text-[var(--ink)]">{t("Attribution and license", "ការទទួលស្គាល់ និងអាជ្ញាបណ្ណ")}</p><p className="mt-1">{t("WASM model and C++ engine by Seanghay Yath. Licensed under the MIT License. The model predicts context; review suggested changes before publishing.", "ម៉ូដែល WASM និងម៉ាស៊ីន C++ បង្កើតដោយ Seanghay Yath។ មានអាជ្ញាបណ្ណ MIT។ ម៉ូដែលព្យាករតាមបរិបទ សូមពិនិត្យការកែសម្រួលមុនបោះពុម្ពផ្សាយ។")}</p><a href="https://github.com/seanghay/khmer-coeng-tada-corrector" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[var(--gold)] underline"><ExternalLink size={12} /> seanghay/khmer-coeng-tada-corrector</a></aside>
    </div>
  </ToolShell>;
}
