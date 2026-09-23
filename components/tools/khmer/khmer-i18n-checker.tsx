"use client";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Row, TextArea, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { checkTranslations, type IssueKind, type JsonValue } from "@/lib/khmer-devkit";

const SAMPLE_EN = JSON.stringify({
  nav: { home: "Home", settings: "Settings", logout: "Log out" },
  cart: { items: "You have {count} items", checkout: "Checkout", empty: "Your cart is empty" },
  welcome: "Welcome back, <b>{{name}}</b>!",
  save: "Save",
}, null, 2);

const SAMPLE_KM = JSON.stringify({
  nav: { home: "ទំព័រដើម", settings: "Settings", logout: "ចាកចេញ" },
  cart: { items: "អ្នកមានទំនិញ {total}", checkout: "" },
  welcome: "សូមស្វាគមន៍ការត្រឡប់មកវិញ {{name}}!",
  save: "រក្សាទុក ",
  legacy: "ចាស់",
}, null, 2);

const KIND_LABEL: Record<IssueKind, [string, string]> = {
  missing: ["Missing in Khmer", "ខ្វះក្នុងខ្មែរ"],
  extra: ["Only in Khmer (unused?)", "មានតែក្នុងខ្មែរ (មិនប្រើ?)"],
  empty: ["Empty translation", "ការបកប្រែទទេ"],
  untranslated: ["Same as source (untranslated?)", "ដូចប្រភព (មិនទាន់បកប្រែ?)"],
  "no-khmer": ["No Khmer script", "គ្មានអក្សរខ្មែរ"],
  placeholder: ["Placeholder mismatch", "Placeholder មិនត្រូវគ្នា"],
  tags: ["HTML tag mismatch", "ស្លាក HTML មិនត្រូវគ្នា"],
  whitespace: ["Leading/trailing space", "ចន្លោះនៅដើម/ចុង"],
  invisible: ["Invisible character at edge", "តួអក្សរមើលមិនឃើញនៅគែម"],
  type: ["Value type differs", "ប្រភេទតម្លៃខុសគ្នា"],
};

const SEVERE: IssueKind[] = ["missing", "empty", "placeholder", "tags", "type"];

function parse(text: string): { value: JsonValue | null; error: string | null } {
  if (!text.trim()) return { value: null, error: null };
  try {
    return { value: JSON.parse(text) as JsonValue, error: null };
  } catch (e) {
    return { value: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export default function KhmerI18nChecker() {
  const { text: t } = useLanguage();
  const [source, setSource] = useToolState("khmer-i18n:source", "");
  const [target, setTarget] = useToolState("khmer-i18n:target", "");
  const [requireKhmer, setRequireKhmer] = useToolState("khmer-i18n:require-km", true);
  const [filter, setFilter] = useToolState<IssueKind | "all">("khmer-i18n:filter", "all");

  const src = useMemo(() => parse(source), [source]);
  const tgt = useMemo(() => parse(target), [target]);
  const report = useMemo(() => (src.value !== null && tgt.value !== null ? checkTranslations(src.value, tgt.value, { requireKhmer }) : null), [src.value, tgt.value, requireKhmer]);

  const counts = useMemo(() => {
    const c = new Map<IssueKind, number>();
    for (const i of report?.issues ?? []) c.set(i.kind, (c.get(i.kind) ?? 0) + 1);
    return c;
  }, [report]);
  const shown = (report?.issues ?? []).filter((i) => filter === "all" || i.kind === filter);
  const coverage = report && report.sourceKeys ? Math.round((report.translated / report.sourceKeys) * 100) : 0;

  return (
    <ToolShell
      title="Khmer Translation File Checker"
      khmerTitle="ឧបករណ៍ពិនិត្យឯកសារបកប្រែខ្មែរ"
      description="Paste your English (source) and Khmer i18n JSON files — i18next, react-intl, vue-i18n, Laravel, or any key/value JSON — and find what's broken before you ship: missing and orphaned keys, empty or untranslated strings, values with no Khmer script, lost {placeholders} or %s, mismatched HTML tags, and stray spaces or zero-width characters. Export the missing keys as JSON for your translator. Runs in your browser; nothing is uploaded."
      descriptionKm="បិទភ្ជាប់ឯកសារ JSON i18n ភាសាអង់គ្លេស (ប្រភព) និងខ្មែររបស់អ្នក — i18next, react-intl, vue-i18n, Laravel ឬ JSON key/value ណាមួយ — ហើយរកអ្វីដែលខូចមុនពេលចេញផ្សាយ៖ key ដែលបាត់ និងនៅសល់ ខ្សែអក្សរទទេ ឬមិនទាន់បកប្រែ តម្លៃគ្មានអក្សរខ្មែរ {placeholder} ឬ %s ដែលបាត់ ស្លាក HTML មិនត្រូវគ្នា និងចន្លោះ ឬតួអក្សរសូន្យដែលលើស។ នាំចេញ key ដែលបាត់ជា JSON សម្រាប់អ្នកបកប្រែ។ ដំណើរការក្នុងកម្មវិធីរុករក គ្មានការផ្ញើឡើងទេ។"
    >
      <Row>
        <Field label="Source JSON (e.g. en.json)" labelKm="JSON ប្រភព (ឧ. en.json)">
          <TextArea value={source} onChange={(e) => setSource(e.target.value)} rows={12} spellCheck={false} placeholder='{ "save": "Save" }' />
        </Field>
        <Field label="Khmer JSON (e.g. km.json)" labelKm="JSON ខ្មែរ (ឧ. km.json)">
          <TextArea value={target} onChange={(e) => setTarget(e.target.value)} rows={12} spellCheck={false} lang="km" placeholder='{ "save": "រក្សាទុក" }' />
        </Field>
      </Row>

      <div className="flex flex-wrap items-center gap-2">
        <PillAction onClick={() => { setSource(SAMPLE_EN); setTarget(SAMPLE_KM); }}>{t("Try a sample", "សាកគំរូ")}</PillAction>
        <Pill active={requireKhmer} onClick={() => setRequireKhmer((v) => !v)}>{t("Flag values with no Khmer script", "សម្គាល់តម្លៃគ្មានអក្សរខ្មែរ")}</Pill>
      </div>

      {(src.error || tgt.error) && (
        <div className="rounded-md border border-[var(--danger)]/50 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          {src.error && <p>{t("Source JSON is not valid:", "JSON ប្រភពមិនត្រឹមត្រូវ៖")} <span className="font-mono-ui">{src.error}</span></p>}
          {tgt.error && <p>{t("Khmer JSON is not valid:", "JSON ខ្មែរមិនត្រឹមត្រូវ៖")} <span className="font-mono-ui">{tgt.error}</span></p>}
        </div>
      )}

      {!report && !src.error && !tgt.error && (
        <p className="text-xs text-[var(--ink-faint)]">{t("Paste both files to see the report.", "បិទភ្ជាប់ឯកសារទាំងពីរដើម្បីមើលរបាយការណ៍។")}</p>
      )}

      {report && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={t("Source keys", "key ប្រភព")} value={report.sourceKeys} />
            <Stat label={t("Khmer keys", "key ខ្មែរ")} value={report.targetKeys} />
            <Stat label={t("Clean translations", "ការបកប្រែល្អ")} value={`${report.translated} (${coverage}%)`} />
            <Stat label={t("Issues", "បញ្ហា")} value={report.issues.length} danger={report.issues.some((i) => SEVERE.includes(i.kind))} />
          </div>

          {report.issues.length > 0 && (
            <PillGroup label={t("Show", "បង្ហាញ")}>
              <Pill active={filter === "all"} onClick={() => setFilter("all")}>{t("All", "ទាំងអស់")} ({report.issues.length})</Pill>
              {(Object.keys(KIND_LABEL) as IssueKind[]).filter((k) => counts.get(k)).map((k) => (
                <Pill key={k} active={filter === k} onClick={() => setFilter(k)}>{t(KIND_LABEL[k][0], KIND_LABEL[k][1])} ({counts.get(k)})</Pill>
              ))}
            </PillGroup>
          )}

          {report.issues.length === 0 ? (
            <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-sm text-[var(--ink)]">{t("No issues found — every key is present and looks translated.", "រកមិនឃើញបញ្ហាទេ — key គ្រប់មានវត្តមាន ហើយមើលទៅបានបកប្រែ។")}</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="bg-[var(--ground-raised)] text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                  <tr>
                    <th className="px-3 py-2">{t("Key", "Key")}</th>
                    <th className="px-3 py-2">{t("Problem", "បញ្ហា")}</th>
                    <th className="px-3 py-2">{t("Source", "ប្រភព")}</th>
                    <th className="px-3 py-2">{t("Khmer", "ខ្មែរ")}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((i) => (
                    <tr key={`${i.key}:${i.kind}`} className="border-t border-[var(--ground-line)] align-top">
                      <td className="px-3 py-2 font-mono-ui text-xs text-[var(--ink)]">{i.key}</td>
                      <td className={`px-3 py-2 text-xs ${SEVERE.includes(i.kind) ? "text-[var(--danger)]" : "text-[var(--gold)]"}`}>
                        {t(KIND_LABEL[i.kind][0], KIND_LABEL[i.kind][1])}
                        {i.detail && <span className="block font-mono-ui text-[var(--ink-faint)]">{i.detail}</span>}
                      </td>
                      <td className="px-3 py-2 text-[var(--ink-dim)]">{i.source ?? "—"}</td>
                      <td lang="km" className="px-3 py-2 font-khmer text-[var(--ink)]">{i.target === undefined ? "—" : JSON.stringify(i.target).slice(1, -1) || "∅"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {report.missingJson && <Output label="Missing keys for translator (JSON)" value={report.missingJson} />}
        </>
      )}

      <SourceCredits>
        <p>{t(
          "Both files are flattened to dotted keys (nav.home, list.0) and compared key by key. Placeholders recognised: {name} and ICU {count, plural…} arguments, {{name}} (i18next / vue-i18n), %s %d %1$s %(name)s (printf / gettext style), and $t(key) nesting. “No Khmer script” and “same as source” are heuristics — brand names, codes, and units may legitimately stay in English, so review before changing them. Original Tools123 implementation; runs locally.",
          "ឯកសារទាំងពីរត្រូវបានពន្លាតជា key មានចំណុច (nav.home, list.0) ហើយប្រៀបធៀបម្តងមួយ key។ Placeholder ដែលស្គាល់៖ {name} និងអាគុយម៉ង់ ICU {count, plural…}, {{name}} (i18next / vue-i18n), %s %d %1$s %(name)s (បែប printf / gettext) និង $t(key)។ «គ្មានអក្សរខ្មែរ» និង «ដូចប្រភព» ជាការប៉ាន់ស្មាន — ឈ្មោះម៉ាក កូដ និងឯកតាអាចនៅជាអង់គ្លេសដោយត្រឹមត្រូវ ដូច្នេះសូមពិនិត្យមុនកែ។ ការអនុវត្តដើមរបស់ Tools123 ដំណើរការក្នុងម៉ាស៊ីន។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}

function Stat({ label, value, danger }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
      <div className="text-xs text-[var(--ink-faint)]">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${danger ? "text-[var(--danger)]" : "text-[var(--ink)]"}`}>{value}</div>
    </div>
  );
}
