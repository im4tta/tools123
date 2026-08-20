"use client";

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { joinToString, split as splitKhmer } from "split-khmer";
import { segment as segmentToolkit } from "khmer-nlp-toolkit";

function browserSegments(value: string) {
  const text = value.trim();
  if (!text) return [];
  return splitKhmer(text);
}

function compact(value: string) {
  return value.replace(/\s+/gu, "");
}

function boundaries(tokens: string[]) {
  const positions = new Set<number>();
  let position = 0;
  tokens.slice(0, -1).forEach((token) => {
    position += [...token].length;
    positions.add(position);
  });
  return positions;
}

function score(expected: string[], actual: string[]) {
  const expectedBoundaries = boundaries(expected);
  const actualBoundaries = boundaries(actual);
  const matches = [...actualBoundaries].filter((position) => expectedBoundaries.has(position)).length;
  const precision = actualBoundaries.size ? matches / actualBoundaries.size : expectedBoundaries.size ? 0 : 1;
  const recall = expectedBoundaries.size ? matches / expectedBoundaries.size : actualBoundaries.size ? 0 : 1;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return { matches, precision, recall, f1 };
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function kccClusters(value: string) {
  if (!value.trim()) return [];
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) return [...new Intl.Segmenter("km", { granularity: "grapheme" }).segment(value)].map(({ segment }) => segment);
  return [...value];
}

export default function KhmerWordSegmentationTester() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-word-segmentation-tester:input", "កម្ពុជាមានភាសាខ្មែរ");
  const [expected, setExpected] = useToolState("khmer-word-segmentation-tester:expected", "កម្ពុជា\nមាន\nភាសា\nខ្មែរ");

  const actual = useMemo(() => browserSegments(input), [input]);
  const toolkitTokens = useMemo(() => segmentToolkit(input), [input]);
  const kccTokens = useMemo(() => kccClusters(input), [input]);
  const zeroWidthOutput = useMemo(() => joinToString(actual), [actual]);
  const expectedTokens = useMemo(() => (expected.includes("|") ? expected.split("|") : expected.split(/\r?\n/)).map((token) => token.trim()).filter(Boolean), [expected]);
  const compatibleExpected = compact(expectedTokens.join("")) === compact(input);
  const metrics = useMemo(() => compatibleExpected && expectedTokens.length ? score(expectedTokens, actual) : null, [actual, compatibleExpected, expectedTokens]);
  const toolkitMetrics = useMemo(() => compatibleExpected && expectedTokens.length ? score(expectedTokens, toolkitTokens) : null, [compatibleExpected, expectedTokens, toolkitTokens]);

  return (
    <ToolShell
      title="Khmer Word Segmentation Tester"
      khmerTitle="កម្មវិធីសាកល្បងបំបែកពាក្យខ្មែរ"
      description="Split Khmer sentences into word arrays using Seanghay Yath's split-khmer package, then compare the result against expected word boundaries."
      descriptionKm="បំបែកប្រយោគខ្មែរទៅជាបញ្ជីពាក្យដោយប្រើកញ្ចប់ split-khmer របស់ Seanghay Yath ហើយប្រៀបធៀបលទ្ធផលជាមួយព្រំដែនពាក្យដែលរំពឹងទុក។"
    >
      <Field label="Unsegmented Khmer text" labelKm="អត្ថបទខ្មែរមិនទាន់បំបែកពាក្យ">
        <TextArea rows={5} value={input} onChange={(event) => setInput(event.target.value)} className="font-khmer text-lg" />
      </Field>
      <Field label="Reference words (optional)" labelKm="ពាក្យយោង (ជម្រើស)" hint={t("One word per line", "មួយពាក្យក្នុងមួយបន្ទាត់")}>
        <TextArea rows={4} value={expected.replaceAll("|", "\n")} onChange={(event) => setExpected(event.target.value)} className="font-khmer text-lg" />
      </Field>

      {!compatibleExpected && expectedTokens.length > 0 && (
        <p role="status" className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          {t("The reference words do not match the input once spaces and line breaks are removed.", "ពាក្យយោងមិនត្រូវនឹងអត្ថបទដើមទេ បន្ទាប់ពីដកដកឃ្លា និងបន្ទាត់ថ្មីចេញ។")}
        </p>
      )}

      <section className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium text-[var(--ink)]">{t("Browser result", "លទ្ធផលពីកម្មវិធីរុករក")}</h2>
          <CopyButton text={actual.join("\n")} compact />
        </div>
        <p className="mt-3 whitespace-pre-wrap break-words font-khmer text-lg leading-8 text-[var(--ink)]">{actual.length ? actual.join("\n") : "—"}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <h2 className="mb-2 font-medium text-[var(--ink)]">JSON output</h2>
          <pre className="overflow-auto whitespace-pre-wrap break-words rounded border border-[var(--ground-line)] bg-[var(--ground)] p-3 font-mono-ui text-xs text-[var(--ink-dim)]">{JSON.stringify(actual, null, 2)}</pre>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <h2 className="mb-2 font-medium text-[var(--ink)]">Zero-width-space output</h2>
          <textarea readOnly value={zeroWidthOutput} rows={5} className="w-full resize-y rounded border border-[var(--ground-line)] bg-[var(--ground)] p-3 font-khmer text-sm leading-relaxed text-[var(--ink)]" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4">
          <h2 className="font-medium text-[var(--ink)]">Mr. Seanghay · split-khmer</h2>
          <p className="mt-1 text-[10px] text-[var(--ink-faint)]">MIT · original JavaScript splitter</p>
          <p className="mt-3 whitespace-pre-wrap break-words font-khmer text-lg leading-8 text-[var(--ink)]">{actual.length ? actual.join("\n") : "—"}</p>
          {metrics && <p className="mt-2 text-xs text-[var(--ink-faint)]">F1: {percent(metrics.f1)} · {metrics.matches} {t("matching boundaries", "ព្រំដែនត្រូវគ្នា")}</p>}
          <a href="https://github.com/seanghay/split-khmer" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-xs text-[var(--gold)] underline">Source · split-khmer</a>
        </div>
        <div className="rounded-md border border-[var(--teal)]/30 bg-[var(--teal)]/5 p-4">
          <h2 className="font-medium text-[var(--ink)]">Vengmony · khmer-nlp-toolkit</h2>
          <p className="mt-1 text-[10px] text-[var(--ink-faint)]">MIT · deterministic maximum-matching toolkit</p>
          <p className="mt-3 break-words font-khmer text-lg leading-8 text-[var(--ink)]">{toolkitTokens.length ? toolkitTokens.join(" | ") : "—"}</p>
          {toolkitMetrics && <p className="mt-2 text-xs text-[var(--ink-faint)]">F1: {percent(toolkitMetrics.f1)} · {toolkitMetrics.matches} {t("matching boundaries", "ព្រំដែនត្រូវគ្នា")}</p>}
          <a href="https://github.com/vengmony/khmer-nlp-toolkit" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-xs text-[var(--teal)] underline">Source · khmer-nlp-toolkit</a>
        </div>
      </section>

      <section className="rounded-md border border-[var(--slate-accent)]/30 bg-[var(--slate-accent)]/10 p-4">
        <h2 className="font-medium text-[var(--ink)]">vvearr · KCC reference tokenizer</h2>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">{t("This is a Khmer Character Cluster view from the project's annotation/tooling approach, not a third word-segmentation model. KCC boundaries must not be interpreted as word boundaries.", "នេះជាទិដ្ឋភាព Khmer Character Cluster តាមវិធីសាស្ត្រឧបករណ៍របស់គម្រោង មិនមែនជាម៉ូដែលបំបែកពាក្យទីបីទេ។ ព្រំដែន KCC មិនគួរបកស្រាយថាជាព្រំដែនពាក្យឡើយ។")}</p>
        <p className="mt-3 break-words font-khmer text-lg leading-8 text-[var(--ink)]">{kccTokens.length ? kccTokens.join(" | ") : "—"}</p>
        <p className="mt-2 text-xs text-[var(--ink-faint)]">{kccTokens.length} KCC clusters · Apache-2.0 project</p>
        <a href="https://github.com/vvearr/khmer-word-segmentation" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-xs text-[var(--slate-accent)] underline">Source · khmer-word-segmentation</a>
      </section>

      {metrics && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [t("Matching boundaries", "ព្រំដែនត្រូវគ្នា"), `${metrics.matches}`],
            [t("Precision", "ភាពត្រឹមត្រូវ"), percent(metrics.precision)],
            [t("Recall", "អត្រារកឃើញ"), percent(metrics.recall)],
            [t("F1 score", "ពិន្ទុ F1"), percent(metrics.f1)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <p className="text-xs text-[var(--ink-faint)]">{label}</p>
              <p className="mt-1 text-lg font-medium text-[var(--gold)]">{value}</p>
            </div>
          ))}
        </section>
      )}

      <aside className="rounded-md border border-[var(--slate-accent)]/30 bg-[var(--slate-accent)]/10 p-4 text-sm leading-relaxed text-[var(--ink-dim)]">
        <p className="mb-2"><strong className="text-[var(--ink)]">{t("Original split-khmer package by Mr. Seanghay Yath", "កញ្ចប់ split-khmer ដើមរបស់លោក Seanghay Yath")}</strong> · MIT License · <a href="https://github.com/seanghay/split-khmer" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:text-[var(--gold-dim)]">GitHub <ExternalLink className="inline" size={13} /></a></p>
        {t("References for evaluating a production segmenter:", "ឯកសារយោងសម្រាប់វាយតម្លៃកម្មវិធីបំបែកពាក្យជាក់ស្តែង៖")}{" "}
        <a href="https://github.com/vvearr/khmer-word-segmentation" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:text-[var(--gold-dim)]">
          vvearr/khmer-word-segmentation <ExternalLink className="inline" size={13} />
        </a>
        {" · "}
        <a href="https://github.com/vengmony/khmer-nlp-toolkit" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:text-[var(--gold-dim)]">
          vengmony/khmer-nlp-toolkit <ExternalLink className="inline" size={13} />
        </a>
        <p className="mt-3 border-t border-[var(--ground-line)] pt-3">
          <strong className="text-[var(--ink)]">Sovichea · Khmer Viterbi Segmenter</strong>{" "}
          {t("is linked as an external reference. Its code is MIT, but its bundled linguistic data has separate noncommercial terms and is not redistributed here.", "ត្រូវបានភ្ជាប់ជាប្រភពយោងខាងក្រៅ។ កូដមានអាជ្ញាបណ្ណ MIT ប៉ុន្តែទិន្នន័យភាសាដែលភ្ជាប់មកជាមួយមានលក្ខខណ្ឌមិនមែនពាណិជ្ជកម្មដាច់ដោយឡែក ហើយមិនត្រូវបានចែកចាយនៅទីនេះទេ។")}{" "}
          <a href="https://sovichea.github.io/khmer_segment_webui_demo/" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] underline">{t("Live demo", "Demo ផ្ទាល់")}</a>{" · "}
          <a href="https://github.com/Sovichea/khmer_segmenter" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] underline">{t("Source", "ប្រភព")}</a>
        </p>
        <p className="mt-3 border-t border-[var(--ground-line)] pt-3">
          <strong className="text-[var(--ink)]">Socret Lee · CLAWS Tokenizer</strong>{" "}
          {t("is linked as an external reference. It is a Python word-segmentation library (a Graph Neural Network with TFLite weights) under the MIT License, so it does not run in the browser and is not bundled here.", "ត្រូវបានភ្ជាប់ជាប្រភពយោងខាងក្រៅ។ វាជាបណ្ណាល័យបំបែកពាក្យភាសា Python (Graph Neural Network ជាមួយទម្ងន់ TFLite) ក្រោមអាជ្ញាបណ្ណ MIT ដូច្នេះមិនដំណើរការក្នុងកម្មវិធីរុករក ហើយមិនត្រូវបានចែកចាយនៅទីនេះទេ។")}{" "}
          <a href="https://github.com/Socret360/claws" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] underline">{t("Source", "ប្រភព")}</a>
        </p>
      </aside>
    </ToolShell>
  );
}
