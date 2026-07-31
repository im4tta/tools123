"use client";

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

function browserSegments(value: string) {
  const text = value.trim();
  if (!text) return [];
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("km", { granularity: "word" });
    return [...segmenter.segment(text)].map(({ segment }) => segment).filter((segment) => segment.trim());
  }
  return text.split(/\s+/u).filter(Boolean);
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

export default function KhmerWordSegmentationTester() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-word-segmentation-tester:input", "កម្ពុជាមានភាសាខ្មែរ");
  const [expected, setExpected] = useToolState("khmer-word-segmentation-tester:expected", "កម្ពុជា|មាន|ភាសា|ខ្មែរ");

  const actual = useMemo(() => browserSegments(input), [input]);
  const expectedTokens = useMemo(() => expected.split("|").map((token) => token.trim()).filter(Boolean), [expected]);
  const compatibleExpected = compact(expectedTokens.join("")) === compact(input);
  const metrics = useMemo(() => compatibleExpected && expectedTokens.length ? score(expectedTokens, actual) : null, [actual, compatibleExpected, expectedTokens]);

  return (
    <ToolShell
      title="Khmer Word Segmentation Tester"
      khmerTitle="កម្មវិធីសាកល្បងបំបែកពាក្យខ្មែរ"
      description="Compare browser word segmentation with expected Khmer word boundaries. Write the expected result with a vertical bar between words; this is an evaluation harness, not a trained word-segmentation model."
      descriptionKm="ប្រៀបធៀបការបំបែកពាក្យរបស់កម្មវិធីរុករកជាមួយព្រំដែនពាក្យខ្មែរដែលរំពឹងទុក។ សូមប្រើសញ្ញា | ដើម្បីបំបែកពាក្យក្នុងលទ្ធផលរំពឹងទុក។ នេះជាឧបករណ៍វាយតម្លៃ មិនមែនជាម៉ូដែលបំបែកពាក្យដែលបានបណ្តុះបណ្តាលទេ។"
    >
      <Field label="Unsegmented Khmer text" labelKm="អត្ថបទខ្មែរមិនទាន់បំបែកពាក្យ">
        <TextArea rows={5} value={input} onChange={(event) => setInput(event.target.value)} className="font-khmer text-lg" />
      </Field>
      <Field label="Expected boundaries" labelKm="ព្រំដែនដែលរំពឹងទុក" hint={t("Use | between words", "ប្រើ | នៅចន្លោះពាក្យ")}>
        <TextArea rows={3} value={expected} onChange={(event) => setExpected(event.target.value)} className="font-khmer text-lg" />
      </Field>

      {!compatibleExpected && expectedTokens.length > 0 && (
        <p role="status" className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          {t("The expected tokens do not match the input once spaces and | markers are removed.", "ពាក្យដែលរំពឹងទុកមិនត្រូវនឹងអត្ថបទដើមទេ បន្ទាប់ពីដកដកឃ្លា និងសញ្ញា | ចេញ។")}
        </p>
      )}

      <section className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium text-[var(--ink)]">{t("Browser result", "លទ្ធផលពីកម្មវិធីរុករក")}</h2>
          <CopyButton text={actual.join(" | ")} compact />
        </div>
        <p className="mt-3 break-words font-khmer text-lg leading-8 text-[var(--ink)]">{actual.length ? actual.join(" | ") : "—"}</p>
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
        {t("References for evaluating a production segmenter:", "ឯកសារយោងសម្រាប់វាយតម្លៃកម្មវិធីបំបែកពាក្យជាក់ស្តែង៖")}{" "}
        <a href="https://github.com/vvearr/khmer-word-segmentation" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:text-[var(--gold-dim)]">
          vvearr/khmer-word-segmentation <ExternalLink className="inline" size={13} />
        </a>
        {" · "}
        <a href="https://github.com/vengmony/khmer-nlp-toolkit" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:text-[var(--gold-dim)]">
          vengmony/khmer-nlp-toolkit <ExternalLink className="inline" size={13} />
        </a>
      </aside>
    </ToolShell>
  );
}
