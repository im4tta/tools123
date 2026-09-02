"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Excel's last column is XFD = 16384 (spreadsheet column limit).
const MAX_COL = 16384;

function lettersToNumber(letters: string): number | null {
  const s = letters.trim().toUpperCase();
  if (!/^[A-Z]{1,3}$/.test(s)) return null;
  let n = 0;
  for (const ch of s) n = n * 26 + ch.charCodeAt(0) - 64;
  return n > MAX_COL ? null : n;
}

function numberToLetters(n: number): string | null {
  if (!Number.isInteger(n) || n < 1 || n > MAX_COL) return null;
  let s = "";
  let v = n;
  while (v > 0) {
    const rem = (v - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    v = Math.floor((v - 1) / 26);
  }
  return s;
}

const REFERENCE = ["A", "B", "C", "D", "Z", "AA", "AZ", "BA", "XFD"];

export default function ExcelColumnConverter() {
  const { text: t } = useLanguage();
  const [letters, setLetters] = useToolState("excel-column-converter:letters", "AA");
  const [number, setNumber] = useToolState("excel-column-converter:number", "27");

  const lettersResult = useMemo(() => lettersToNumber(letters), [letters]);
  const numberResult = useMemo(() => numberToLetters(Number(number)), [number]);

  return (
    <ToolShell
      title="Excel Column Converter"
      khmerTitle="បំលែងជួរឈរ Excel"
      description="Convert Excel column letters to numbers and back — A = 1, Z = 26, AA = 27, up to XFD = 16384."
      descriptionKm="បំលែងអក្សរជួរឈរ Excel ទៅជាលេខ និងបញ្ច្រាស — A = 1, Z = 26, AA = 27 រហូតដល់ XFD = 16384។"
    >
      <Row>
        <Field label={t("Column letters", "អក្សរជួរឈរ")}>
          <TextInput
            value={letters}
            onChange={(e) => setLetters(e.target.value.toUpperCase())}
            placeholder={t("e.g. AA", "ឧ. AA")}
            className="font-mono-ui uppercase"
          />
        </Field>
        <Field label={t("Column number", "លេខជួរឈរ")}>
          <TextInput
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder={t("e.g. 27", "ឧ. 27")}
            className="font-mono-ui"
            inputMode="numeric"
          />
        </Field>
      </Row>

      {lettersResult === null ? (
        <p className="rounded-md border border-dashed border-[var(--danger)]/50 p-4 text-sm text-[var(--danger)]">
          {t("Letters must be 1–3 uppercase A–Z (e.g. A, Z, AA, XFD).", "អក្សរត្រូវជា A–Z អក្សរធំ ១–៣ តួ (ឧ. A, Z, AA, XFD)។")}
        </p>
      ) : (
        <Output label={t("Letters → number", "អក្សរ → លេខ")} value={String(lettersResult)} />
      )}

      {numberResult === null ? (
        <p className="rounded-md border border-dashed border-[var(--danger)]/50 p-4 text-sm text-[var(--danger)]">
          {t("Number must be a whole number from 1 to 16384 (Excel's last column is XFD).", "លេខត្រូវជាចំនួនគត់ពី ១ ដល់ ១៦៣៨៤ (ជួរឈរចុងក្រោយរបស់ Excel គឺ XFD)។")}
        </p>
      ) : (
        <Output label={t("Number → letters", "លេខ → អក្សរ")} value={numberResult} />
      )}

      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
          {t("Reference", "ឯកសារយោង")}
        </div>
        <div className="flex flex-wrap gap-2">
          {REFERENCE.map((r) => (
            <span
              key={r}
              className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1 font-mono-ui text-xs text-[var(--ink)]"
            >
              <span className="text-[var(--gold)]">{r}</span>
              <span className="text-[var(--ink-faint)]"> = {lettersToNumber(r)}</span>
            </span>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
