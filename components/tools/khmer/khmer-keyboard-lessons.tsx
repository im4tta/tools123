"use client";
import { useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, TextInput } from "@/components/ui/Shell";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { KEY_ROWS, convertLatinToKhmer, usBase, usShift, type KeyDef } from "@/lib/khmer-keyboard-niida";
import { compareTyped } from "@/lib/khmer-games";
import { perMinute } from "@/lib/khmer-learning";
import { toKhmerNumerals } from "@/lib/khmer-number-words";

const ROW_NAMES: [string, string][] = [["Number row", "ជួរលេខ"], ["Top row", "ជួរខាងលើ"], ["Home row", "ជួរកណ្តាល"], ["Bottom row", "ជួរខាងក្រោម"]];
const KHMER = /[ក-៿]/;
const GROUPS = 6;
const GROUP_SIZE = 4;

type Layer = "base" | "shift";
interface Unit { text: string; key: KeyDef | null }

function keysFor(row: number, layer: Layer): KeyDef[] {
  return KEY_ROWS[row].filter((k) => KHMER.test(k[layer]));
}

function buildUnits(keys: KeyDef[], layer: Layer, rand: () => number): Unit[] {
  const units: Unit[] = [];
  for (let g = 0; g < GROUPS; g++) {
    if (g) units.push({ text: " ", key: null });
    for (let i = 0; i < GROUP_SIZE; i++) {
      const key = keys[Math.floor(rand() * keys.length)];
      units.push({ text: key[layer], key });
    }
  }
  return units;
}

// Monotonic clock for timing a round; only read from event handlers.
const elapsedClock = () => performance.now();

export default function KhmerKeyboardLessons() {
  const { text: t } = useLanguage();
  const [row, setRow] = useToolState("khmer-keyboard-lessons:row", 2);
  const [layer, setLayer] = useToolState<Layer>("khmer-keyboard-lessons:layer", "base");
  const [useUsKeys, setUseUsKeys] = useToolState("khmer-keyboard-lessons:us-keys", false);
  const [best, setBest] = useToolState<Record<string, number>>("khmer-keyboard-lessons:best", {});
  const [seed, setSeed] = useState(1);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<{ cpm: number; accuracy: number } | null>(null);
  const startedAt = useRef(0);

  const keys = keysFor(row, layer);
  // `seed` only changes on "New drill"; Math.random keeps each drill different.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const units = useMemo(() => (keys.length ? buildUnits(keys, layer, Math.random) : []), [row, layer, seed]);
  const target = units.map((u) => u.text).join("");
  const cmp = compareTyped(target, typed);
  const lessonKey = `${row}-${layer}`;

  // The unit (key) the learner should press next.
  const typedLength = [...typed].length;
  let offset = 0;
  let nextUnit: Unit | null = null;
  for (const u of units) {
    offset += [...u.text].length;
    if (offset > typedLength) { nextUnit = u; break; }
  }

  const reset = (patch?: () => void) => {
    patch?.();
    setTyped("");
    setResult(null);
    startedAt.current = 0;
    setSeed((s) => s + 1);
  };

  const onType = (raw: string) => {
    if (result) return;
    const value = useUsKeys ? convertLatinToKhmer(raw) : raw;
    if (!startedAt.current && value) startedAt.current = elapsedClock();
    setTyped(value);
    const c = compareTyped(target, value);
    if (c.done) {
      const total = [...target].length;
      const accuracy = total ? Math.round((c.correct / total) * 100) : 0;
      const cpm = Math.round(perMinute(total, elapsedClock() - startedAt.current));
      setResult({ cpm, accuracy });
      if (accuracy >= 95 && cpm > (best[lessonKey] ?? 0)) setBest({ ...best, [lessonKey]: cpm });
    }
  };

  // Code-point offset where each unit starts in the drill text.
  const unitStarts = units.reduce<number[]>((acc, u, i) => [...acc, i ? acc[i - 1] + [...units[i - 1].text].length : 0], []);
  return (
    <ToolShell
      title="Khmer Keyboard Lessons"
      khmerTitle="មេរៀនក្ដារចុចខ្មែរ"
      description="Learn the standard Khmer (NIDA) keyboard one row at a time. Each drill uses only the keys of the row you pick, shows the next key on a mini keyboard with its English key label, and reports characters per minute and accuracy. No Khmer keyboard installed? Turn on “Type with English keys” and practise the positions anyway."
      descriptionKm="រៀនក្ដារចុចខ្មែរស្តង់ដារ (NIDA) ម្តងមួយជួរ។ លំហាត់នីមួយៗប្រើតែគ្រាប់ចុចនៃជួរដែលអ្នកជ្រើស បង្ហាញគ្រាប់ចុចបន្ទាប់លើក្ដារចុចតូចជាមួយស្លាកគ្រាប់ចុចអង់គ្លេស ហើយរាយការណ៍តួអក្សរក្នុងមួយនាទី និងភាពត្រឹមត្រូវ។ មិនទាន់មានក្ដារចុចខ្មែរ? បើក «វាយដោយគ្រាប់ចុចអង់គ្លេស» ហើយហាត់ទីតាំងគ្រាប់ចុចបានដដែល។"
    >
      <PillGroup label={t("Row", "ជួរ")}>
        {ROW_NAMES.map(([en, km], i) => (
          <Pill key={en} active={row === i} onClick={() => reset(() => setRow(i))}>{t(en, km)}</Pill>
        ))}
      </PillGroup>
      <PillGroup label={t("Layer", "ស្រទាប់")}>
        <Pill active={layer === "base"} onClick={() => reset(() => setLayer("base"))}>{t("Normal", "ធម្មតា")}</Pill>
        <Pill active={layer === "shift"} onClick={() => reset(() => setLayer("shift"))}>{t("With Shift", "ជាមួយ Shift")}</Pill>
        <Pill active={useUsKeys} onClick={() => reset(() => setUseUsKeys(!useUsKeys))}>{t("Type with English keys", "វាយដោយគ្រាប់ចុចអង់គ្លេស")}</Pill>
      </PillGroup>

      {keys.length === 0 ? (
        <p className="text-sm text-[var(--ink-faint)]">{t("This row has no Khmer characters on this layer. Pick another row or layer.", "ជួរនេះគ្មានតួអក្សរខ្មែរនៅលើស្រទាប់នេះទេ។ សូមជ្រើសជួរ ឬស្រទាប់ផ្សេង។")}</p>
      ) : (
        <div className="space-y-4">
          <div className="relative overflow-x-auto rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4" aria-label={t("Drill text", "អត្ថបទលំហាត់")}>
            <p lang="km" className="whitespace-pre-wrap break-words font-khmer text-3xl leading-[1.8] tracking-wide">
              {units.map((u, i) => {
                const states = cmp.states.slice(unitStarts[i], unitStarts[i] + [...u.text].length);
                const cls = states.every((s) => s === "ok") ? "text-[var(--teal)]" : states.some((s) => s === "bad") ? "bg-[var(--danger)]/15 text-[var(--danger)]" : u === nextUnit ? "rounded bg-[var(--gold)]/20 text-[var(--ink)]" : "text-[var(--ink-dim)]";
                return <span key={i} className={cls}>{u.text}</span>;
              })}
            </p>
          </div>

          <TextInput
            value={typed}
            onChange={(e) => onType(e.target.value)}
            disabled={Boolean(result)}
            lang={useUsKeys ? "en" : "km"}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label={t("Type the drill here", "វាយលំហាត់នៅទីនេះ")}
            placeholder={useUsKeys ? t("Type with your English keyboard…", "វាយដោយក្ដារចុចអង់គ្លេស…") : t("Type the drill with a Khmer keyboard…", "វាយលំហាត់ដោយក្ដារចុចខ្មែរ…")}
            className="font-khmer text-xl"
          />

          <div className="relative overflow-x-auto" aria-hidden="true">
            <div className="flex min-w-max gap-1.5">
              {KEY_ROWS[row].map((k) => {
                const active = nextUnit?.key?.id === k.id;
                const khmer = k[layer];
                return (
                  <div key={k.id} className={`flex h-14 w-11 flex-col items-center justify-center rounded-md border text-center ${active ? "border-[var(--gold)] bg-[var(--gold)]/20" : KHMER.test(khmer) ? "border-[var(--ground-line)] bg-[var(--ground-raised)]" : "border-dashed border-[var(--ground-line)] opacity-50"}`}>
                    <span lang="km" className="font-khmer text-lg leading-tight text-[var(--ink)]">{khmer}</span>
                    <span className="font-mono-ui text-[10px] uppercase text-[var(--ink-faint)]">{layer === "shift" ? `⇧${usShift(k.id)}` : usBase(k.id)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3" role="status">
            {result ? (
              <p className="text-sm text-[var(--ink)]">
                {t(`${result.cpm} characters per minute · ${result.accuracy}% accurate.`, `${toKhmerNumerals(String(result.cpm))} តួអក្សរក្នុងមួយនាទី · ត្រឹមត្រូវ ${toKhmerNumerals(String(result.accuracy))}%។`)}{" "}
                {best[lessonKey] != null && t(`Best (95%+ accuracy): ${best[lessonKey]}.`, `ល្អបំផុត (ត្រឹមត្រូវ ៩៥%+)៖ ${toKhmerNumerals(String(best[lessonKey]))}។`)}
              </p>
            ) : (
              <p className="text-xs text-[var(--ink-faint)]">
                {t(`Correct ${cmp.correct} · mistakes ${cmp.errors}`, `ត្រូវ ${toKhmerNumerals(String(cmp.correct))} · ខុស ${toKhmerNumerals(String(cmp.errors))}`)}
              </p>
            )}
            <PillAction onClick={() => reset()}><RefreshCw size={13} />{t("New drill", "លំហាត់ថ្មី")}</PillAction>
          </div>
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Key positions come from the app's shared NIDA layout table (lib/khmer-keyboard-niida.ts, based on Microsoft's “Khmer (NIDA)” keyboard and Keyman's Khmer Angkor documentation), the same table used by the Keyboard Layout reference and Layout Converter. Characters per minute counts Unicode code points, so a vowel sign counts as one character. Best scores are saved in this browser only. Original Tools123 implementation.",
          "ទីតាំងគ្រាប់ចុចមកពីតារាងប្លង់ NIDA រួមរបស់កម្មវិធី (lib/khmer-keyboard-niida.ts ផ្អែកលើក្ដារចុច «Khmer (NIDA)» របស់ Microsoft និងឯកសារ Khmer Angkor របស់ Keyman) ដូចគ្នានឹងឧបករណ៍ប្លង់ក្ដារចុច និងឧបករណ៍បម្លែងប្លង់។ តួអក្សរក្នុងមួយនាទីរាប់តាមចំណុចកូដយូនីកូដ ដូច្នេះស្រៈមួយរាប់ជាតួអក្សរមួយ។ ពិន្ទុល្អបំផុតរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
