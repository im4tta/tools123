"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Expl = { token: string; meaning: string; km: string };

const TOKEN_RULES: [RegExp, string, string][] = [
  [/^\\d/, "A single digit (0-9)", "លេខមួយខ្ទង់ (0-9)"],
  [/^\\w/, "A word character (letter, digit, underscore)", "តួអក្សរពាក្យ (អក្សរ លេខ ឬសញ្ញាក្រោម)"],
  [/^\\s/, "A whitespace character (space, tab, newline)", "តួអក្សរទំនេរ (ដកឃ្លា tab ឬបន្ទាត់ថ្មី)"],
  [/^\\b/, "A word boundary (start/end of a word)", "ព្រំដែនពាក្យ (ដើម ឬចុងពាក្យ)"],
  [/^\\S/, "A non-whitespace character", "តួអក្សរមិនមែនទំនេរ"],
  [/^\\D/, "A non-digit character", "តួអក្សរមិនមែនលេខ"],
  [/^\\W/, "A non-word character", "តួអក្សរមិនមែនពាក្យ"],
  [/^\./, "Any character (except newline)", "តួអក្សរណាមួយ (លើកលែងបន្ទាត់ថ្មី)"],
  [/^\*/, "Previous item 0 or more times", "ធាតុមុន 0 ដង ឬច្រើន"],
  [/^\+/, "Previous item 1 or more times", "ធាតុមុន 1 ដង ឬច្រើន"],
  [/^\?/, "Previous item 0 or 1 time (optional)", "ធាតុមុន 0 ឬ 1 ដង (អាចមានក៏បាន អត់ក៏បាន)"],
  [/^\{(\d+),?(\d*)\}/, "Repeat exactly the given count", "ធ្វើម្ដងទៀតតាមចំនួនកំណត់"],
  [/^\^/, "Start of the string / line", "ការចាប់ផ្ដើមបន្ទាត់"],
  [/^\$/, "End of the string / line", "ចុងបន្ទាត់"],
  [/^\[/, "A character set (match any one of these)", "ឈុតតួអក្សរ (ត្រូវនឹងមួយក្នុងចំណោម)"],
  [/^\]/, "End of character set", "ចុងឈុតតួអក្សរ"],
  [/^\(/, "Start of a capture group", "ការចាប់ផ្ដើមក្រុមចាប់យក"],
  [/^\)/, "End of a capture group", "ចុងក្រុមចាប់យក"],
  [/^\|/, "OR (alternation)", "ឬ (ជម្រើស)"],
  [/^\\(\d)/, "Backreference to capture group", "យោងត្រឡប់ទៅក្រុមចាប់យក"],
  [/^\\/, "Escape the next character literally", "គេចពីតួអក្សរបន្ទាប់"],
];

function tokenize(pattern: string): Expl[] {
  const out: Expl[] = [];
  let i = 0;
  while (i < pattern.length) {
    const rest = pattern.slice(i);
    let matched: Expl | null = null;
    for (const [re, en, km] of TOKEN_RULES) {
      const m = rest.match(re);
      if (m) {
        matched = { token: m[0], meaning: en, km };
        break;
      }
    }
    if (!matched) {
      const c = rest[0];
      matched = c === " " ? { token: " ", meaning: "A literal space", km: "ដកឃ្លាធម្មតា" } : { token: c, meaning: `A literal "${c}"`, km: `តួអក្សរ "${c}"` };
    }
    out.push(matched);
    i += matched.token.length;
  }
  return out;
}

export default function RegexExplainer() {
  const { text: t } = useLanguage();
  const [pattern, setPattern] = useToolState("regex-explainer:input", "^[a-z0-9]+@[a-z]+\\.[a-z]{2,}$");

  const parts = useMemo(() => {
    try {
      new RegExp(pattern);
      return tokenize(pattern);
    } catch {
      return null;
    }
  }, [pattern]);

  return (
    <ToolShell
      title="Regex Explainer"
      khmerTitle="ពន្យល់ Regex"
      description="Paste any regular expression to see each token explained in plain language."
      descriptionKm="បិទភ្ជាប់ regular expression ណាមួយ ដើម្បីមើលការពន្យល់នីមួយៗជាភាសាសាមញ្ញ។"
    >
      <Field label={t("Pattern", "លំនាំ")}>
        <TextInput value={pattern} onChange={(e) => setPattern(e.target.value)} className="font-mono-ui" placeholder="^[a-z]+$" />
      </Field>
      {parts === null ? (
        <p className="text-sm text-[var(--danger)]">{t("Invalid regular expression", "Regular expression មិនត្រឹមត្រូវ")}</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-[var(--ground-line)]">
          {parts.map((p, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-[var(--ground-line)] last:border-0">
              <span className="min-w-16 shrink-0 bg-[var(--ground-raised)] px-3 py-2 font-mono-ui text-[var(--gold)]">{p.token || "·"}</span>
              <span className="px-3 py-2 text-sm text-[var(--ink)]">{t(p.meaning, p.km)}</span>
            </div>
          ))}
        </div>
      )}
    </ToolShell>
  );
}