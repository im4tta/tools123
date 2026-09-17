"use client";
import { useMemo } from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { toolHref } from "@/lib/toolRoutes";
import { parseKhqr, CURRENCY_NAMES, type KhqrField } from "@/lib/khqr";

// A valid sample produced by the KHQR generator: static merchant, KHR, with an
// additional-data reference and a Khmer-language merchant name template.
const SAMPLE =
  "00020101021126670002010109SOKDARA010213sok_dara@aclb0313Sok Dara Shop0410Phnom Penh5204581453031165802KH5913Sok Dara Shop6010Phnom Penh62170513INV-2026-004264690002km0134ហាងសុខ ដារ៉ា0221ភ្នំពេញ6304B01E";

export default function KhqrDecoder() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khqr-decoder:input", SAMPLE);
  const result = useMemo(() => parseKhqr(input), [input]);
  const hasInput = input.trim().length > 0;

  const summary = result.summary;
  const currencyName = summary.currency ? CURRENCY_NAMES[summary.currency] : undefined;
  const amountDisplay =
    summary.amount != null && summary.amount !== ""
      ? summary.currency === "116"
        ? `៛ ${summary.amount}`
        : summary.currency === "840"
          ? `$ ${summary.amount}`
          : summary.amount
      : undefined;

  const summaryRows: { label: string; labelKm: string; value?: string }[] = [
    { label: "Type", labelKm: "ប្រភេទ", value: summary.isDynamic == null ? undefined : summary.isDynamic ? t("Dynamic (one-time / fixed amount)", "ថាមវន្ត (ប្រើម្តង / ចំនួនកំណត់)") : t("Static (reusable)", "ថេរ (ប្រើឡើងវិញ)") },
    { label: "Merchant", labelKm: "អាជីវករ", value: summary.merchantName },
    { label: "Merchant (Khmer)", labelKm: "អាជីវករ (ខ្មែរ)", value: summary.merchantNameAlt },
    { label: "Bakong account", labelKm: "គណនី Bakong", value: summary.bakongAccount },
    { label: "Amount", labelKm: "ចំនួនទឹកប្រាក់", value: amountDisplay ?? (summary.amount === undefined ? t("Any amount (payer enters)", "តាមចិត្ត (អ្នកបង់បញ្ចូល)") : undefined) },
    { label: "Currency", labelKm: "រូបិយប័ណ្ណ", value: currencyName ? t(currencyName.en, currencyName.km) : summary.currency },
    { label: "City", labelKm: "ទីក្រុង", value: summary.city },
    { label: "Country", labelKm: "ប្រទេស", value: summary.country },
  ].filter((r) => r.value);

  return (
    <ToolShell
      title="KHQR Decoder & Validator"
      khmerTitle="ឌិកូដ និងផ្ទៀងផ្ទាត់ KHQR"
      description="Paste a KHQR / Bakong payment payload to break it into labelled EMVCo fields, read the merchant, amount, and currency, and verify its CRC checksum — all in your browser."
      descriptionKm="បិទភ្ជាប់ទិន្នន័យ KHQR / Bakong ដើម្បីបំបែកជាវាលEMVCo មានស្លាក អានឈ្មោះអាជីវករ ចំនួនទឹកប្រាក់ និងរូបិយប័ណ្ណ ព្រមទាំងផ្ទៀងផ្ទាត់ CRC — ទាំងអស់នៅក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      <Field
        label={t("KHQR payload", "ទិន្នន័យ KHQR")}
        labelKm="ទិន្នន័យ KHQR"
        hint={t("the text a KHQR scans to", "អត្ថបទដែល KHQR ស្កេនចេញ")}
        hintKm="អត្ថបទដែល KHQR ស្កេនចេញ"
      >
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          placeholder="00020101021126..."
          spellCheck={false}
        />
      </Field>

      {hasInput && (
        <>
          {/* CRC verdict */}
          {result.crc ? (
            result.crc.ok ? (
              <div className="flex items-start gap-2 rounded-md border border-[var(--success)]/40 bg-[var(--success)]/10 p-3 text-sm text-[var(--success)]">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span>{t(`Valid CRC checksum (${result.crc.embedded}).`, `ផលបូក CRC ត្រឹមត្រូវ (${result.crc.embedded})។`)}</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-md border border-[var(--danger)]/50 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
                <XCircle size={16} className="mt-0.5 shrink-0" />
                <span>
                  {t(
                    `CRC mismatch — payload carries ${result.crc.embedded} but recomputes to ${result.crc.computed}. The code may be edited, truncated, or contain non-ASCII fields.`,
                    `CRC មិនត្រូវគ្នា — ទិន្នន័យមាន ${result.crc.embedded} ប៉ុន្តែគណនាឡើងវិញបាន ${result.crc.computed}។ កូដនេះប្រហែលបានកែ កាត់ខ្លី ឬមានវាលមិនមែន ASCII។`,
                  )}
                </span>
              </div>
            )
          ) : (
            result.fields.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-[var(--gold-dim)]/50 bg-[var(--gold)]/10 p-3 text-sm text-[var(--gold)]">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{t("No CRC field (tag 63) found — this may be a partial payload.", "រកមិនឃើញវាល CRC (ស្លាក 63) — នេះប្រហែលជាទិន្នន័យមិនពេញលេញ។")}</span>
              </div>
            )
          )}

          {result.errors.length > 0 && (
            <div className="rounded-md border border-[var(--danger)]/50 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
              <p className="mb-1 font-semibold">{t("Parse warnings", "ការព្រមានពេលញែក")}</p>
              <ul className="list-disc space-y-0.5 pl-5">
                {result.errors.map((err, i) => (
                  <li key={i}>{t(err, err)}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary */}
          {summaryRows.length > 0 && (
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("Summary", "សេចក្តីសង្ខេប")}</h2>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {summaryRows.map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-[var(--ground-line)]/60 pb-1">
                    <dt className="shrink-0 text-xs text-[var(--ink-faint)]">{t(row.label, row.labelKm)}</dt>
                    <dd className="min-w-0 break-words text-right text-sm font-medium text-[var(--ink)]" lang={row.label.includes("Khmer") ? "km" : undefined}>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Full field breakdown */}
          {result.fields.length > 0 && (
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("All data objects", "វត្ថុទិន្នន័យទាំងអស់")}</h2>
              <div className="space-y-1.5">
                {result.fields.map((field, i) => (
                  <FieldRow key={`${field.tag}-${i}`} field={field} t={t} />
                ))}
              </div>
            </div>
          )}

          {result.fields.length === 0 && result.errors.length === 0 && (
            <p className="text-sm text-[var(--ink-faint)]">{t("Nothing to decode yet.", "មិនទាន់មានអ្វីត្រូវឌិកូដទេ។")}</p>
          )}
        </>
      )}

      {/* Source & Credits */}
      <section className="mt-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] p-4 text-xs leading-relaxed text-[var(--ink-dim)]">
        <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</h2>
        <p>
          {t(
            "This decoder reads the payload you paste — no data is sent anywhere. Field names, the tag structure, and the CRC-16/CCITT algorithm follow the EMVCo Merchant-Presented Mode QR specification; currency numbers are ISO 4217 and country codes are ISO 3166-1. The Cambodia-specific merchant template is defined by the National Bank of Cambodia's Bakong system — sub-tag meanings marked “commonly” are the usual Bakong interpretation, not an official guarantee.",
            "ឧបករណ៍នេះអានតែទិន្នន័យដែលអ្នកបិទភ្ជាប់ — គ្មានទិន្នន័យត្រូវបានផ្ញើទៅណាទេ។ ឈ្មោះវាល រចនាសម្ព័ន្ធស្លាក និងក្បួន CRC-16/CCITT អនុលោមតាមស្តង់ដារ EMVCo Merchant-Presented Mode QR។ លេខរូបិយប័ណ្ណតាម ISO 4217 និងលេខកូដប្រទេសតាម ISO 3166-1។ គំរូអាជីវករជាក់លាក់សម្រាប់កម្ពុជាកំណត់ដោយប្រព័ន្ធ Bakong នៃធនាគារជាតិកម្ពុជា — អត្ថន័យស្លាករងដែលសម្គាល់ “ជាទូទៅ” គឺជាការបកស្រាយធម្មតារបស់ Bakong មិនមែនជាការធានាផ្លូវការទេ។",
          )}
        </p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <a href="https://www.emvco.com/emv-technologies/qr-codes/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--gold)]">EMVCo QR Codes</a>
          <a href="https://bakong.nbc.gov.kh/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--gold)]">NBC Bakong</a>
          <a href={toolHref("khqr-generator")} className="underline hover:text-[var(--gold)]">{t("Need to create one? KHQR Generator →", "ចង់បង្កើតមួយ? KHQR Generator →")}</a>
        </p>
      </section>
    </ToolShell>
  );
}

function FieldRow({ field, t }: { field: KhqrField; t: (en: string, km: string) => string }) {
  const isKhmerValue = /[ក-៿]/.test(field.value);
  return (
    <div className="rounded border border-[var(--ground-line)]/60 bg-[var(--ground)] px-3 py-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="rounded bg-[var(--ground-raised)] px-1.5 py-0.5 font-mono-ui text-[10px] text-[var(--gold)]">{field.tag}</span>
        <span className="text-xs font-medium text-[var(--ink)]">{t(field.label.en, field.label.km)}</span>
        <span className="ml-auto text-[10px] text-[var(--ink-faint)]">{t(`${field.length} bytes`, `${field.length} បៃ`)}</span>
      </div>
      {!field.children && (
        <div className="mt-1 break-all font-mono-ui text-xs text-[var(--ink-dim)]" lang={isKhmerValue ? "km" : undefined}>{field.value || "—"}</div>
      )}
      {field.meaning && (
        <div className="mt-0.5 text-[11px] text-[var(--ink-faint)]">→ {t(field.meaning.en, field.meaning.km)}</div>
      )}
      {field.children && field.children.length > 0 && (
        <div className="mt-2 space-y-1 border-l-2 border-[var(--ground-line)] pl-3">
          {field.children.map((child, i) => {
            const childKhmer = /[ក-៿]/.test(child.value);
            return (
              <div key={`${child.tag}-${i}`} className="flex flex-wrap items-baseline gap-x-2">
                <span className="rounded bg-[var(--ground-raised)] px-1 py-0.5 font-mono-ui text-[10px] text-[var(--ink-faint)]">{child.tag}</span>
                <span className="text-[11px] text-[var(--ink-dim)]">{t(child.label.en, child.label.km)}</span>
                <span className="break-all font-mono-ui text-[11px] text-[var(--ink)]" lang={childKhmer ? "km" : undefined}>{child.value || "—"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
