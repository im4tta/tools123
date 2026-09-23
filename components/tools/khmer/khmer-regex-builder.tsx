"use client";
import { useMemo, type ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, TextInput, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { KHMER_REGEX, regexSnippet, type RegexLang } from "@/lib/khmer-devkit";

const SAMPLE = "ឈ្មោះ៖ សុខ ដារ៉ា\nទូរស័ព្ទ៖ ០១២ ៣៤៥ ៦៧៨ / 012 345 678\nតម្លៃ៖ ៥០០០៛ ។ ាខុស ក្";

const LANGS: { id: RegexLang; label: string }[] = [
  { id: "js", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "php", label: "PHP" },
  { id: "java", label: "Java / Kotlin" },
  { id: "go", label: "Go" },
];

export default function KhmerRegexBuilder() {
  const { text: t } = useLanguage();
  const [presetId, setPresetId] = useToolState("khmer-regex:preset", "any");
  const [pattern, setPattern] = useToolState("khmer-regex:pattern", KHMER_REGEX[0].pattern);
  const [sample, setSample] = useToolState("khmer-regex:sample", SAMPLE);
  const [lang, setLang] = useToolState<RegexLang>("khmer-regex:lang", "js");
  const [multiline, setMultiline] = useToolState("khmer-regex:multiline", true);

  const preset = KHMER_REGEX.find((e) => e.id === presetId);

  const compiled = useMemo(() => {
    if (!pattern) return { re: null as RegExp | null, error: null as string | null };
    try {
      return { re: new RegExp(pattern, `gu${multiline ? "m" : ""}`), error: null };
    } catch (e) {
      return { re: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [pattern, multiline]);

  const { highlighted, count } = useMemo(() => {
    const re = compiled.re;
    if (!re || !sample) return { highlighted: [sample] as ReactNode[], count: 0 };
    const parts: ReactNode[] = [];
    let last = 0;
    let n = 0;
    for (const m of sample.matchAll(re)) {
      const i = m.index ?? 0;
      if (m[0] === "") continue; // skip zero-width matches (e.g. anchors)
      if (i > last) parts.push(sample.slice(last, i));
      parts.push(<mark key={i} className="rounded-sm bg-[var(--gold)]/30 text-[var(--ink)]">{m[0]}</mark>);
      last = i + m[0].length;
      n += 1;
    }
    if (last < sample.length) parts.push(sample.slice(last));
    return { highlighted: parts, count: n };
  }, [compiled.re, sample]);

  const lineMatches = useMemo(() => {
    if (!compiled.re || !/^\^|\$$/.test(pattern)) return null;
    const single = new RegExp(pattern, "u");
    return sample.split("\n").map((line) => ({ line, ok: single.test(line) }));
  }, [compiled.re, pattern, sample]);

  const choose = (id: string) => {
    const e = KHMER_REGEX.find((x) => x.id === id);
    if (!e) return;
    setPresetId(id);
    setPattern(e.pattern);
  };

  return (
    <ToolShell
      title="Khmer Regex Builder"
      khmerTitle="ឧបករណ៍បង្កើត Regex សម្រាប់ខ្មែរ"
      description="Ready-made regular expressions for Khmer text — consonants, vowels, subscripts, Khmer digits, punctuation, name fields, and validators that catch common typing errors like a vowel with no base letter or a dangling subscript sign. Pick a pattern, tweak it, test it live against your own text, and copy a snippet for JavaScript, Python, PHP, Java, or Go with the right Unicode escape syntax for each."
      descriptionKm="កន្សោម regular expression សម្រាប់អត្ថបទខ្មែរដែលរៀបចំរួច — ព្យញ្ជនៈ ស្រៈ ជើង លេខខ្មែរ វណ្ណយុត្តិ វាលឈ្មោះ និងការផ្ទៀងផ្ទាត់ដែលចាប់កំហុសវាយទូទៅ ដូចជាស្រៈគ្មានតួគោល ឬសញ្ញាជើងអណ្តែត។ ជ្រើសលំនាំ កែសម្រួល សាកល្បងផ្ទាល់ជាមួយអត្ថបទរបស់អ្នក ហើយចម្លងកូដសម្រាប់ JavaScript, Python, PHP, Java ឬ Go ជាមួយវាក្យសម្ព័ន្ធ Unicode escape ត្រឹមត្រូវសម្រាប់នីមួយៗ។"
    >
      <PillGroup label={t("Pattern library", "បណ្ណាល័យលំនាំ")}>
        {KHMER_REGEX.map((e) => (
          <Pill key={e.id} active={presetId === e.id && pattern === e.pattern} onClick={() => choose(e.id)}>{t(e.en, e.km)}</Pill>
        ))}
      </PillGroup>
      {preset && pattern === preset.pattern && <p className="-mt-3 text-xs text-[var(--ink-faint)]">{t(preset.noteEn, preset.noteKm)}</p>}

      <Field label="Pattern" labelKm="លំនាំ" hint={"\\uXXXX escapes, Unicode (u) flag"} hintKm={"ប្រើ \\uXXXX ជាមួយទង់ Unicode (u)"}>
        <TextInput value={pattern} onChange={(e) => setPattern(e.target.value)} className="font-mono-ui" spellCheck={false} autoComplete="off" />
      </Field>
      {compiled.error && <p className="text-sm text-[var(--danger)]">{t("Invalid pattern:", "លំនាំមិនត្រឹមត្រូវ៖")} <span className="font-mono-ui">{compiled.error}</span></p>}

      <Field label="Test text" labelKm="អត្ថបទសាកល្បង">
        <TextArea value={sample} onChange={(e) => setSample(e.target.value)} rows={4} lang="km" className="font-khmer" />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <Pill active={multiline} onClick={() => setMultiline((v) => !v)}>{t("^ $ match each line (m flag)", "^ $ ផ្គូផ្គងបន្ទាត់នីមួយៗ (ទង់ m)")}</Pill>
        <PillAction onClick={() => setSample(SAMPLE)}>{t("Reset sample", "កំណត់គំរូឡើងវិញ")}</PillAction>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t(`Matches: ${count}`, `ផ្គូផ្គង៖ ${count}`)}</div>
        <pre lang="km" className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 font-khmer text-sm leading-relaxed text-[var(--ink)]">{highlighted}</pre>
      </div>

      {lineMatches && multiline && (
        <ul className="space-y-1 text-sm">
          {lineMatches.map((l, i) => (
            <li key={i} className="flex items-baseline gap-2">
              <span className={l.ok ? "text-[var(--gold)]" : "text-[var(--danger)]"}>{l.ok ? "✓" : "✗"}</span>
              <span lang="km" className="font-khmer text-[var(--ink-dim)]">{l.line || "∅"}</span>
            </li>
          ))}
        </ul>
      )}

      <PillGroup label={t("Code snippet", "កូដ")}>
        {LANGS.map((l) => <Pill key={l.id} active={lang === l.id} onClick={() => setLang(l.id)}>{l.label}</Pill>)}
      </PillGroup>
      <Output value={pattern ? regexSnippet(pattern, lang) : ""} />

      <SourceCredits>
        <p>{t(
          "Character ranges are taken from the Unicode Standard's Khmer (U+1780–U+17FF) and Khmer Symbols (U+19E0–U+19FF) block charts. The syllable pattern is a deliberate approximation, not a full Khmer syllable grammar, and the error patterns flag suspicious sequences for review rather than proving text is wrong. Testing uses your browser's JavaScript engine; other languages' engines differ in small ways (Go's RE2 has no lookbehind). Original Tools123 implementation.",
          "ជួរតួអក្សរយកពីតារាងប្លុក Khmer (U+1780–U+17FF) និង Khmer Symbols (U+19E0–U+19FF) នៃស្តង់ដារ Unicode។ លំនាំព្យាង្គជាការប៉ាន់ស្មានដោយចេតនា មិនមែនវេយ្យាករណ៍ព្យាង្គខ្មែរពេញលេញទេ ហើយលំនាំកំហុសសម្គាល់លំដាប់គួរសង្ស័យសម្រាប់ពិនិត្យ មិនមែនបញ្ជាក់ថាអត្ថបទខុសទេ។ ការសាកល្បងប្រើម៉ាស៊ីន JavaScript របស់កម្មវិធីរុករក ម៉ាស៊ីនភាសាផ្សេងខុសគ្នាបន្តិចបន្តួច (RE2 របស់ Go គ្មាន lookbehind)។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
        <p className="mt-1"><a className="underline hover:text-[var(--ink-dim)]" href="https://www.unicode.org/charts/PDF/U1780.pdf" target="_blank" rel="noreferrer">unicode.org/charts/PDF/U1780.pdf</a></p>
      </SourceCredits>
    </ToolShell>
  );
}
