"use client";

import { useMemo } from "react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const COENG = "\u17d2";

type Issue = { index: number; en: string; km: string };

function codePoint(char: string) {
  return char.codePointAt(0) ?? 0;
}

function isConsonant(char: string) {
  const cp = codePoint(char);
  return cp >= 0x1780 && cp <= 0x17a2;
}

function isBase(char: string) {
  const cp = codePoint(char);
  return isConsonant(char) || (cp >= 0x17a3 && cp <= 0x17b3);
}

function isSequenceMark(char: string) {
  const cp = codePoint(char);
  return (cp >= 0x17b4 && cp <= 0x17d1) || cp === 0x17d3;
}

function normalizeKhmer(value: string) {
  const hiddenCharacters = [...value].filter((char) => /[\u200B\u200C\u200D\uFEFF]/u.test(char)).length;
  const clean = value
    .normalize("NFC")
    .replace(/[\u200B\u200C\u200D\uFEFF]+/gu, "")
    .replace(/[ \t]+/gu, " ")
    .replace(/ *\n */gu, "\n")
    .trim();
  const chars = [...clean];
  const result: string[] = [];
  let movedSubscripts = 0;

  for (let index = 0; index < chars.length;) {
    if (!isBase(chars[index])) {
      result.push(chars[index]);
      index += 1;
      continue;
    }

    const base = chars[index];
    const subscripts: string[] = [];
    const marks: string[] = [];
    let cursor = index + 1;
    let sawMark = false;
    while (cursor < chars.length) {
      if (chars[cursor] === COENG && isConsonant(chars[cursor + 1] ?? "")) {
        if (sawMark) movedSubscripts += 1;
        subscripts.push(chars[cursor], chars[cursor + 1]);
        cursor += 2;
      } else if (isSequenceMark(chars[cursor])) {
        sawMark = true;
        marks.push(chars[cursor]);
        cursor += 1;
      } else {
        break;
      }
    }

    result.push(base, ...subscripts, ...marks);
    index = cursor;
  }

  const issues: Issue[] = [];
  let hasBase = false;
  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    if (isBase(char)) {
      hasBase = true;
      continue;
    }
    if (char === COENG) {
      if (!hasBase) issues.push({ index, en: "Subscript sign has no preceding base consonant.", km: "សញ្ញាជើងអក្សរគ្មានព្យញ្ជនៈមូលដ្ឋាននៅខាងមុខ។" });
      if (!isConsonant(chars[index + 1] ?? "")) issues.push({ index, en: "Subscript sign is not followed by a Khmer consonant.", km: "សញ្ញាជើងអក្សរមិនត្រូវបានតាមដោយព្យញ្ជនៈខ្មែរ។" });
      continue;
    }
    if (isSequenceMark(char) && !hasBase) {
      issues.push({ index, en: "Dependent vowel or sign has no base character.", km: "ស្រៈនិស្ស័យ ឬសញ្ញាមិនមានតួអក្សរមូលដ្ឋាន។" });
      continue;
    }
    if (/\s/u.test(char) || codePoint(char) < 0x1780 || codePoint(char) > 0x17ff) hasBase = false;
  }

  return {
    output: result.join(""),
    hiddenCharacters,
    movedSubscripts,
    changedNfc: value.normalize("NFC") !== value,
    issues,
  };
}

export default function KhmerUnicodeNormalizer() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-unicode-normalizer:input", "");
  const result = useMemo(() => normalizeKhmer(input), [input]);

  return (
    <ToolShell
      title="Khmer Typing Sequence Normalizer"
      khmerTitle="កែសម្រួលលំដាប់វាយអក្សរខ្មែរ"
      description="Normalize Khmer text to NFC, remove invisible characters, and place subscript consonant pairs before dependent signs when they were typed out of order. Review flagged sequences before replacing source text."
      descriptionKm="កែសម្រួលអត្ថបទខ្មែរទៅជា NFC ដកតួអក្សរមើលមិនឃើញ និងរៀបគូអក្សរជើងឱ្យនៅមុខសញ្ញានិស្ស័យនៅពេលវាយខុសលំដាប់។ សូមពិនិត្យកំហុសដែលបានសម្គាល់មុនជំនួសអត្ថបទដើម។"
    >
      <Field label="Input" labelKm="អត្ថបទដើម">
        <TextArea rows={7} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("Paste Khmer Unicode text…", "បិទភ្ជាប់អត្ថបទយូនីកូដខ្មែរ…")} className="font-khmer" />
      </Field>
      <Field label="Normalized output" labelKm="លទ្ធផលដែលបានសម្រួល" hint={`${result.output.length} ${t("characters", "តួអក្សរ")}`}>
        <div className="relative">
          <TextArea rows={7} value={result.output} readOnly className="pr-12 font-khmer" />
          <CopyButton text={result.output} compact className="absolute right-2 top-2" />
        </div>
      </Field>
      <section className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-sm">
        <h2 className="font-medium text-[var(--ink)]">{t("Sequence check", "ពិនិត្យលំដាប់")}</h2>
        <p className="mt-1 text-[var(--ink-dim)]">
          {t(
            `${result.hiddenCharacters} hidden character(s) removed; NFC ${result.changedNfc ? "changed" : "unchanged"}; ${result.movedSubscripts} subscript pair(s) reordered.`,
            `បានដកតួអក្សរមើលមិនឃើញ ${result.hiddenCharacters} តួ; NFC ${result.changedNfc ? "ត្រូវបានកែ" : "មិនផ្លាស់ប្តូរ"}; បានរៀបគូអក្សរជើង ${result.movedSubscripts} គូ។`
          )}
        </p>
        {result.issues.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {result.issues.map((issue, index) => (
              <li key={`${issue.index}-${index}`} className="rounded border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-[var(--danger)]">
                {t(`Character ${issue.index + 1}: ${issue.en}`, `តួអក្សរទី ${issue.index + 1}៖ ${issue.km}`)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[var(--success)]">{t("No incomplete Khmer sequence was detected.", "មិនបានរកឃើញលំដាប់អក្សរខ្មែរមិនពេញលេញទេ។")}</p>
        )}
      </section>
    </ToolShell>
  );
}
