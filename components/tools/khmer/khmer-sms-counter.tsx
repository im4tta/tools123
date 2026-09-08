"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

// SMS encoding follows GSM 03.38: messages using only the GSM 7-bit alphabet
// fit 160 characters (153 per part when concatenated); any character outside it
// — all Khmer script — forces UCS-2 (UTF-16), which fits only 70 characters
// (67 per part). So Khmer SMS cost more parts than the same length in Latin.
const GSM_BASIC = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"
);
const GSM_EXTENDED = new Set(["\f", "^", "{", "}", "\\", "[", "~", "]", "|", "€"]);

interface SmsStats {
  encoding: "GSM-7" | "UCS-2";
  units: number;
  graphemes: number;
  codeUnits: number;
  segments: number;
  perSegment: number;
  remaining: number;
  firstNonGsm: string | null;
}

function analyze(text: string): SmsStats {
  let isGsm = true;
  let septets = 0;
  let firstNonGsm: string | null = null;
  for (const ch of text) {
    if (GSM_BASIC.has(ch)) septets += 1;
    else if (GSM_EXTENDED.has(ch)) septets += 2;
    else {
      isGsm = false;
      if (firstNonGsm === null) firstNonGsm = ch;
    }
  }
  const codeUnits = text.length; // UTF-16 code units (UCS-2 billing unit)
  let graphemes = codeUnits;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      graphemes = [...seg.segment(text)].length;
    } catch { /* fall back to code units */ }
  }

  const encoding = isGsm ? "GSM-7" : "UCS-2";
  const units = isGsm ? septets : codeUnits;
  const singleMax = isGsm ? 160 : 70;
  const concatMax = isGsm ? 153 : 67;
  const segments = units === 0 ? 0 : units <= singleMax ? 1 : Math.ceil(units / concatMax);
  const perSegment = segments <= 1 ? singleMax : concatMax;
  const remaining = segments === 0 ? singleMax : perSegment * segments - units;
  return { encoding, units, graphemes, codeUnits, segments, perSegment, remaining, firstNonGsm };
}

export default function KhmerSmsCounter() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-sms:input", "សួស្តី! សូមអរគុណសម្រាប់ការបញ្ជាទិញ។");

  const s = useMemo(() => analyze(input), [input]);

  const cards: { label: string; km: string; value: string; accent?: boolean }[] = [
    { label: "Encoding", km: "ការអ៊ិនកូដ", value: s.encoding, accent: true },
    { label: "SMS segments", km: "ចំនួនផ្នែក SMS", value: String(s.segments), accent: true },
    { label: s.encoding === "GSM-7" ? "Septets" : "UTF-16 units", km: s.encoding === "GSM-7" ? "សិបទីត" : "ឯកតា UTF-16", value: String(s.units) },
    { label: "Grapheme clusters", km: "ចង្កោមអក្សរ", value: String(s.graphemes) },
    { label: "Chars left in this message", km: "តួអក្សរនៅសល់ក្នុងសារនេះ", value: String(s.remaining) },
    { label: "Per-segment limit", km: "កម្រិតក្នុងមួយផ្នែក", value: String(s.perSegment) },
  ];

  return (
    <ToolShell
      title="Khmer SMS & Unicode Counter"
      khmerTitle="ឧបករណ៍រាប់ SMS និង Unicode ខ្មែរ"
      description="Count characters, Unicode length, and real SMS segments for Khmer and mixed text. Because Khmer uses UCS-2, each SMS holds only 70 characters (67 when concatenated) instead of 160."
      descriptionKm="រាប់តួអក្សរ ប្រវែង Unicode និងចំនួនផ្នែក SMS ពិតប្រាកដសម្រាប់អត្ថបទខ្មែរ និងលាយ។ ដោយសារខ្មែរប្រើ UCS-2 SMS នីមួយៗផ្ទុកបានតែ ៧០ តួអក្សរ (៦៧ ពេលភ្ជាប់គ្នា) ជំនួសឲ្យ ១៦០។"
    >
      <Field label="Message text" labelKm="អត្ថបទសារ">
        <TextArea rows={5} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-faint)]">{t(c.label, c.km)}</div>
            <div className={`mt-1 font-mono-ui text-lg font-semibold ${c.accent ? "text-[var(--gold)]" : "text-[var(--ink)]"}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {s.encoding === "UCS-2" && s.firstNonGsm && (
        <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          {t(
            `This message is UCS-2 because it contains non-GSM characters (first one: "${s.firstNonGsm}"). All Khmer text triggers this, so the same wording costs more than double the SMS parts of Latin-only text.`,
            `សារនេះជា UCS-2 ព្រោះមានតួអក្សរក្រៅ GSM (ដំបូងគេ៖ "${s.firstNonGsm}")។ អត្ថបទខ្មែរទាំងអស់បង្កឲ្យបែបនេះ ដូច្នេះពាក្យដដែលចំណាយផ្នែក SMS ច្រើនជាងទ្វេដងធៀបនឹងអត្ថបទឡាតាំងសុទ្ធ។`
          )}
        </p>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Follows GSM 03.38: GSM-7 messages fit 160 characters (153 per concatenated part); UCS-2 fit 70 (67 per part). A few GSM symbols ({ } [ ] | ^ ~ \\ €) count as two. Counts are computed locally.",
          "អនុលោមតាម GSM 03.38៖ សារ GSM-7 ផ្ទុក ១៦០ តួអក្សរ (១៥៣ ក្នុងមួយផ្នែកភ្ជាប់); UCS-2 ផ្ទុក ៧០ (៦៧ ក្នុងមួយផ្នែក)។ និមិត្តសញ្ញា GSM មួយចំនួន ({ } [ ] | ^ ~ \\ €) រាប់ជាពីរ។ ការរាប់ធ្វើឡើងក្នុងឧបករណ៍។"
        )}
      </p>
    </ToolShell>
  );
}
