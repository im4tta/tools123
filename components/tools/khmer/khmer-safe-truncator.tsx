"use client";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Row, TextArea, TextInput, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { cutsCluster, measure, naiveTruncate, safeTruncate, type LengthUnit } from "@/lib/khmer-devkit";

const SAMPLE = "ស្ត្រីកម្ពុជាចូលរួមសិក្ខាសាលាស្តីពីបច្ចេកវិទ្យាព័ត៌មាន";

const UNITS: { id: LengthUnit; en: string; km: string; hintEn: string; hintKm: string }[] = [
  { id: "graphemes", en: "Visible characters", km: "តួអក្សរមើលឃើញ", hintEn: "grapheme clusters — what a reader counts", hintKm: "ក្រុមអក្សរ — អ្វីដែលអ្នកអានរាប់" },
  { id: "codepoints", en: "Code points", km: "ចំណុចកូដ (code point)", hintEn: "Postgres/MySQL VARCHAR(n), Python len()", hintKm: "Postgres/MySQL VARCHAR(n), Python len()" },
  { id: "utf16", en: "UTF-16 units", km: "ឯកតា UTF-16", hintEn: "JavaScript .length, Java, C#, SQL Server NVARCHAR", hintKm: "JavaScript .length, Java, C#, SQL Server NVARCHAR" },
  { id: "utf8", en: "UTF-8 bytes", km: "បៃ UTF-8", hintEn: "byte limits: headers, filenames, Redis, Go len()", hintKm: "ដែនកំណត់បៃ៖ header ឈ្មោះឯកសារ Redis Go len()" },
];

const SNIPPET = `// Grapheme-safe truncation (browsers, Node 16+, Deno, Bun)
function truncateKhmer(text, max, ellipsis = "…") {
  const seg = new Intl.Segmenter("km", { granularity: "grapheme" });
  const parts = [...seg.segment(text)].map((s) => s.segment);
  if (parts.length <= max) return text;
  return parts.slice(0, Math.max(0, max - 1)).join("") + ellipsis;
}`;

export default function KhmerSafeTruncator() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-truncate:input", "");
  const [limit, setLimit] = useToolState("khmer-truncate:limit", "20");
  const [unit, setUnit] = useToolState<LengthUnit>("khmer-truncate:unit", "utf16");
  const [ellipsis, setEllipsis] = useToolState("khmer-truncate:ellipsis", "…");
  const [wordBoundary, setWordBoundary] = useToolState("khmer-truncate:word", false);

  const n = Math.max(0, Math.floor(Number(limit) || 0));
  const sizes = useMemo(() => UNITS.map((u) => ({ ...u, size: measure(input, u.id) })), [input]);
  const safe = useMemo(() => safeTruncate(input, n, unit, ellipsis, wordBoundary), [input, n, unit, ellipsis, wordBoundary]);
  const naive = useMemo(() => {
    const cut = naiveTruncate(input, Math.max(0, n - measure(ellipsis, unit)), unit);
    return { text: cut === input ? input : cut + ellipsis, broken: cutsCluster(input, cut) };
  }, [input, n, unit, ellipsis]);

  return (
    <ToolShell
      title="Khmer Grapheme-Safe Truncator"
      khmerTitle="ឧបករណ៍កាត់អត្ថបទខ្មែរដោយសុវត្ថិភាព"
      description="Cutting Khmer text with .slice() or substr() can split a cluster in half — leaving a dangling subscript (្), an orphan vowel, or a broken UTF-8 byte (�). Set a limit in visible characters, code points, UTF-16 units, or UTF-8 bytes and get a truncation that always ends on a whole cluster (and optionally on a word boundary), side by side with what a naive cut produces, plus a copy-paste JavaScript snippet. Runs in your browser."
      descriptionKm="ការកាត់អត្ថបទខ្មែរដោយ .slice() ឬ substr() អាចបំបែកក្រុមអក្សរជាពីរ — បន្សល់ជើង (្) អណ្តែត ស្រៈកំព្រា ឬបៃ UTF-8 ខូច (�)។ កំណត់ដែនជាតួអក្សរមើលឃើញ code point ឯកតា UTF-16 ឬបៃ UTF-8 ហើយទទួលបានការកាត់ដែលតែងបញ្ចប់នៅក្រុមអក្សរពេញ (និងជាជម្រើសនៅព្រំដែនពាក្យ) ប្រៀបធៀបជាមួយការកាត់ធម្មតា ព្រមទាំងកូដ JavaScript សម្រាប់ចម្លង។ ដំណើរការក្នុងកម្មវិធីរុករក។"
    >
      <Field label="Khmer text" labelKm="អត្ថបទខ្មែរ">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={4} lang="km" className="font-khmer" placeholder="Paste or type Khmer text…" />
      </Field>
      <div className="flex flex-wrap gap-2">
        <PillAction onClick={() => setInput(SAMPLE)}>{t("Try a sample", "សាកគំរូ")}</PillAction>
      </div>

      <PillGroup label={t("Limit is measured in", "ដែនកំណត់វាស់ជា")}>
        {UNITS.map((u) => (
          <Pill key={u.id} active={unit === u.id} onClick={() => setUnit(u.id)}>{t(u.en, u.km)}</Pill>
        ))}
      </PillGroup>
      <p className="-mt-3 text-xs text-[var(--ink-faint)]">{(() => { const u = UNITS.find((x) => x.id === unit)!; return t(u.hintEn, u.hintKm); })()}</p>

      <Row>
        <Field label="Maximum length" labelKm="ប្រវែងអតិបរមា">
          <TextInput type="number" min={0} inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label="Ellipsis (counted in the limit)" labelKm="សញ្ញាបន្ត (រាប់ក្នុងដែនកំណត់)">
          <TextInput value={ellipsis} onChange={(e) => setEllipsis(e.target.value)} />
        </Field>
      </Row>
      <div className="flex flex-wrap gap-2">
        <Pill active={wordBoundary} onClick={() => setWordBoundary((v) => !v)}>{t("Prefer ending on a whole word", "ចូលចិត្តបញ្ចប់នៅពាក្យពេញ")}</Pill>
      </div>

      {input && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sizes.map((s) => (
            <div key={s.id} className={`rounded-md border p-3 ${s.id === unit ? "border-[var(--gold)]" : "border-[var(--ground-line)]"} bg-[var(--ground-raised)]`}>
              <div className="text-xs text-[var(--ink-faint)]">{t(s.en, s.km)}</div>
              <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{s.size}</div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t(`Safe result (${safe.size} / ${n})`, `លទ្ធផលសុវត្ថិភាព (${safe.size} / ${n})`)}</div>
        <Output value={input ? safe.text : ""} mono={false} />
      </div>

      {input && safe.truncated && (
        <div className={`rounded-md border p-3 text-sm ${naive.broken ? "border-[var(--danger)]/50 bg-[var(--danger)]/10" : "border-[var(--ground-line)] bg-[var(--ground-raised)]"}`}>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Naive cut, for comparison", "ការកាត់ធម្មតា សម្រាប់ប្រៀបធៀប")}</p>
          <p lang="km" className="break-words font-khmer text-[var(--ink)]">{naive.text}</p>
          <p className={`mt-1 text-xs ${naive.broken ? "text-[var(--danger)]" : "text-[var(--ink-faint)]"}`}>
            {naive.broken
              ? t("This cut splits a Khmer cluster — the last letter would render broken.", "ការកាត់នេះបំបែកក្រុមអក្សរខ្មែរ — អក្សរចុងក្រោយនឹងបង្ហាញខូច។")
              : t("At this limit the naive cut happens to land on a cluster boundary.", "នៅដែនកំណត់នេះ ការកាត់ធម្មតាចៃដន្យធ្លាក់ត្រូវព្រំដែនក្រុមអក្សរ។")}
          </p>
        </div>
      )}

      <Output label="JavaScript snippet" value={SNIPPET} />

      <SourceCredits>
        <p>{t(
          "Clusters come from the ECMAScript Intl.Segmenter API (Unicode UAX #29 extended grapheme clusters, as implemented by your browser's ICU); word boundaries use the same API's Khmer dictionary segmentation, which is approximate. Sizes are exact for the chosen unit; the ellipsis is counted inside the limit. Original Tools123 implementation.",
          "ក្រុមអក្សរមកពី API Intl.Segmenter របស់ ECMAScript (ក្រុមអក្សរពង្រីក Unicode UAX #29 តាមការអនុវត្ត ICU របស់កម្មវិធីរុករក) ព្រំដែនពាក្យប្រើការបំបែកតាមវចនានុក្រមខ្មែររបស់ API ដដែល ដែលជាការប៉ាន់ស្មាន។ ទំហំគឺពិតប្រាកដសម្រាប់ឯកតាដែលបានជ្រើស សញ្ញាបន្តត្រូវរាប់ក្នុងដែនកំណត់។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
