"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, TextInput, ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

type KeyDef = { id: string; base: string; shift: string };

// Curated NIIDA standard Khmer Unicode keyboard layout (base + Shift layers),
// laid out on the physical US QWERTY positions.
// Source: Microsoft "Khmer (NIDA)" keyboard tables (kbdkni.dll) and Keyman's
// "Khmer Angkor" documentation, both of which follow the NiDA standard.
const KEY_ROWS: KeyDef[][] = [
  [
    { id: "`", base: "«", shift: "»" },
    { id: "1", base: "១", shift: "!" },
    { id: "2", base: "២", shift: "ៗ" },
    { id: "3", base: "៣", shift: "\"" },
    { id: "4", base: "៤", shift: "៛" },
    { id: "5", base: "៥", shift: "%" },
    { id: "6", base: "៦", shift: "៍" },
    { id: "7", base: "៧", shift: "័" },
    { id: "8", base: "៨", shift: "៏" },
    { id: "9", base: "៩", shift: "(" },
    { id: "0", base: "០", shift: ")" },
    { id: "-", base: "ឥ", shift: "៌" },
    { id: "=", base: "ឲ", shift: "=" },
  ],
  [
    { id: "q", base: "ឆ", shift: "ឈ" },
    { id: "w", base: "ឹ", shift: "ឺ" },
    { id: "e", base: "េ", shift: "ែ" },
    { id: "r", base: "រ", shift: "ឬ" },
    { id: "t", base: "ត", shift: "ទ" },
    { id: "y", base: "យ", shift: "ួ" },
    { id: "u", base: "ុ", shift: "ូ" },
    { id: "i", base: "ិ", shift: "ី" },
    { id: "o", base: "ោ", shift: "ៅ" },
    { id: "p", base: "ផ", shift: "ភ" },
    { id: "[", base: "ៀ", shift: "ឿ" },
    { id: "]", base: "ឪ", shift: "ឧ" },
  ],
  [
    { id: "a", base: "ា", shift: "ាំ" },
    { id: "s", base: "ស", shift: "ៃ" },
    { id: "d", base: "ដ", shift: "ឌ" },
    { id: "f", base: "ថ", shift: "ធ" },
    { id: "g", base: "ង", shift: "អ" },
    { id: "h", base: "ហ", shift: "ះ" },
    { id: "j", base: "្", shift: "ញ" },
    { id: "k", base: "ក", shift: "គ" },
    { id: "l", base: "ល", shift: "ឡ" },
    { id: ";", base: "ើ", shift: "ោះ" },
    { id: "'", base: "់", shift: "៉" },
    { id: "\\", base: "ឮ", shift: "ឭ" },
  ],
  [
    { id: "z", base: "ឋ", shift: "ឍ" },
    { id: "x", base: "ខ", shift: "ឃ" },
    { id: "c", base: "ច", shift: "ជ" },
    { id: "v", base: "វ", shift: "េះ" },
    { id: "b", base: "ប", shift: "ព" },
    { id: "n", base: "ន", shift: "ណ" },
    { id: "m", base: "ម", shift: "ំ" },
    { id: ",", base: "ុំ", shift: "ុះ" },
    { id: ".", base: "។", shift: "៕" },
    { id: "/", base: "៊", shift: "?" },
  ],
];

const ALL_KEYS = KEY_ROWS.flat();

type FindMatch = { key: KeyDef; layer: "base" | "shift"; char: string };

export default function KhmerKeyboardLayout() {
  const { text: t } = useLanguage();
  const [output, setOutput] = useToolState("khmer-keyboard-layout:output", "");
  const [shiftOn, setShiftOn] = useState(false);
  const [findQuery, setFindQuery] = useToolState("khmer-keyboard-layout:find", "");

  const insert = (key: KeyDef) => setOutput((prev) => prev + (shiftOn ? key.shift : key.base));
  const backspace = () => setOutput((prev) => Array.from(prev).slice(0, -1).join(""));

  // Find-key mode: exact key output match first; single characters also match
  // any key whose output contains them (e.g. កា finds the keys that make it up).
  const findMatches = useMemo<FindMatch[]>(() => {
    const q = findQuery.trim();
    if (!q) return [];
    const exact: FindMatch[] = [];
    const partial: FindMatch[] = [];
    for (const key of ALL_KEYS) {
      if (key.base === q) exact.push({ key, layer: "base", char: key.base });
      else if (key.shift === q) exact.push({ key, layer: "shift", char: key.shift });
      if (Array.from(q).length === 1) {
        if (key.base.includes(q)) partial.push({ key, layer: "base", char: key.base });
        else if (key.shift.includes(q)) partial.push({ key, layer: "shift", char: key.shift });
      }
    }
    return exact.length ? exact : partial;
  }, [findQuery]);

  const matchedIds = useMemo(() => new Set(findMatches.map((m) => m.key.id)), [findMatches]);

  return (
    <ToolShell
      title="Khmer Keyboard Layout (NIIDA)"
      khmerTitle="ក្ដារចុចខ្មែរ (NIIDA)"
      description="Click the keys to type Khmer on the standard NIIDA layout (base + Shift layers), and paste any Khmer character to find which key produces it."
      descriptionKm="ចុចលើគ្រាប់ចុចដើម្បីវាយអក្សរខ្មែរតាមប្លង់ស្ដង់ដារ NIIDA (ស្រទាប់ធម្មតា + Shift) ហើយបិទភ្ជាប់តួអក្សរខ្មែរណាមួយ ដើម្បីរកគ្រាប់ចុចដែលវាយចេញអក្សរនោះ។"
    >
      <Field label="Typed text" labelKm="អត្ថបទដែលបានវាយ">
        <TextArea
          rows={3}
          value={output}
          onChange={(e) => setOutput(e.target.value)}
          placeholder={t("Click the keys or type here…", "ចុចលើគ្រាប់ចុច ឬវាយនៅទីនេះ…")}
          className="font-khmer"
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setShiftOn((s) => !s)} className={shiftOn ? "ring-2 ring-[var(--ink)]" : "opacity-80"}>
          {shiftOn ? t("Shift ON", "គ្រាប់ Shift បើក") : t("Shift", "គ្រាប់ Shift")}
        </Button>
        <Button type="button" onClick={backspace}>
          {t("Backspace", "លុបថយក្រោយ")}
        </Button>
        <Button type="button" onClick={() => setOutput("")}>
          {t("Clear", "សម្អាត")}
        </Button>
      </div>

      <div className="mx-auto max-w-3xl select-none space-y-1.5">
        {KEY_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5">
            {row.map((key) => {
              const matched = matchedIds.has(key.id);
              const matchedLayer = findMatches.find((m) => m.key.id === key.id)?.layer;
              return (
                <button
                  key={key.id}
                  type="button"
                  onClick={() => insert(key)}
                  title={`${key.id} → ${key.base}${key.shift ? ` / ${key.shift}` : ""}`}
                  className={`min-w-0 flex-1 rounded-md border px-0.5 pb-1 pt-1.5 text-center transition hover:border-[var(--gold-dim)] hover:bg-[var(--gold-dim)]/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold-dim)] ${
                    matched
                      ? "border-[var(--gold)] bg-[var(--gold-dim)]/15 ring-1 ring-[var(--gold)]"
                      : "border-[var(--ground-line)] bg-[var(--ground-raised)]"
                  }`}
                >
                  <span
                    className={`block text-[10px] leading-none ${
                      shiftOn ? "font-bold text-[var(--ink)]" : "text-[var(--gold)]"
                    } ${matched && matchedLayer === "shift" ? "underline decoration-[var(--gold)] decoration-2" : ""}`}
                  >
                    {key.shift}
                  </span>
                  <span
                    className={`mt-1 block font-khmer text-base leading-none ${
                      shiftOn ? "text-[var(--ink-faint)]" : "font-bold text-[var(--ink)]"
                    } ${matched && matchedLayer === "base" ? "underline decoration-[var(--gold)] decoration-2" : ""}`}
                  >
                    {key.base}
                  </span>
                  <span className="mt-1 block text-[9px] uppercase leading-none text-[var(--ink-faint)]">{key.id}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <Field label="Find a key" labelKm="រកគ្រាប់ចុច" hint="Paste any Khmer character" hintKm="បិទភ្ជាប់តួអក្សរខ្មែរណាមួយ">
        <TextInput
          value={findQuery}
          onChange={(e) => setFindQuery(e.target.value)}
          placeholder={t("e.g. ក, ខ, ែ…", "ឧ. ក ខ ែ…")}
          className="font-khmer"
          autoComplete="off"
        />
        {findQuery.trim() ? (
          findMatches.length ? (
            <p className="mt-2 text-xs leading-relaxed text-[var(--ink-dim)]">
              {t("Found on", "រកឃើញនៅលើ")}:{" "}
              {findMatches.map((m) => (
                <code key={`${m.key.id}-${m.layer}`} className="mr-1.5 rounded bg-[var(--ground)] px-1.5 py-0.5 font-khmer text-[var(--gold)]">
                  {m.char} → {m.layer === "shift" ? "Shift+" : ""}
                  {m.key.id.toUpperCase()}
                </code>
              ))}
            </p>
          ) : (
            <p className="mt-2 text-xs text-[var(--ink-faint)]">
              {t("No key produces that character.", "រកមិនឃើញគ្រាប់ចុចណាដែលវាយចេញតួអក្សរនេះទេ។")}
            </p>
          )
        ) : (
          <p className="mt-2 text-xs text-[var(--ink-faint)]">
            {t(
              "Type or paste a Khmer character to highlight the key that produces it.",
              "វាយ ឬបិទភ្ជាប់តួអក្សរខ្មែរមួយ ដើម្បីបន្លិចគ្រាប់ចុចដែលវាយចេញអក្សរនោះ។"
            )}
          </p>
        )}
      </Field>

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Reference: the standard NIIDA Khmer keyboard layout (base + Shift layers) used by Khmer Unicode. Layout data follows the Khmer (NIDA) keyboard tables (kbdkni) and Keyman's Khmer Angkor documentation. Reference only — actual key positions depend on your operating system and input method.",
          "ឯកសារយោង៖ ប្លង់ក្ដារចុចខ្មែរស្ដង់ដារ NIIDA (ស្រទាប់ធម្មតា + Shift) ដែលប្រើក្នុងខ្មែរយូនីកូដ។ ទិន្នន័យប្លង់តាមតារាងក្ដារចុច Khmer (NIDA) (kbdkni) និងឯកសារ Khmer Angkor របស់ Keyman។ គ្រាន់តែជាឯកសារយោង — ទីតាំងគ្រាប់ចុចពិតប្រាកដអាស្រ័យលើប្រព័ន្ធប្រតិបត្តិការ និងវិធីបញ្ចូលអក្សររបស់អ្នក។"
        )}
      </p>
    </ToolShell>
  );
}
