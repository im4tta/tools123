"use client";
import { useMemo } from "react";
import { AlertTriangle, CircleCheck } from "lucide-react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function parseDate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function daysBetween(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

export default function DocumentExpiryReminder() {
  const { text: t } = useLanguage();
  const [docName, setDocName] = useToolState("expiry:doc", "Passport");
  const [issued, setIssued] = useToolState("expiry:issued", "");
  const [expiry, setExpiry] = useToolState("expiry:expiry", "");
  const [ruleDays, setRuleDays] = useToolState("expiry:rule", "180");

  const result = useMemo(() => {
    const isExpiry = parseDate(expiry);
    const now = new Date();
    if (!isExpiry) return null;
    const remaining = daysBetween(now, isExpiry);
    const daysToRule = remaining - (Number(ruleDays) || 0);
    return { remaining, expires: isExpiry, daysToRule };
  }, [expiry, ruleDays]);

  const status = result
    ? result.remaining <= 0
      ? "expired"
      : result.daysToRule <= 0
        ? "rule"
        : "ok"
    : null;

  return (
    <ToolShell
      title="Document Expiry Reminder"
      khmerTitle="រំលឹកផុតកំណត់ឯកសារ"
      description="Check how long a passport, visa, or document stays valid, and get a warning when it's getting close to the 6-month-before-expiry travel rule."
      descriptionKm="ពិនិត្យរយៈពេលនៃលិខិតឆ្លងដែន ទិដ្ឋាការ ឬឯកសារនៅមានសុពលភាព និងទទួលបានក្រុមអាសន្ន នៅពេលជិតផុតកំណត់ ៦ ខែមុនពេលធ្វើដំណើរ។"
    >
      <Row>
        <Field label={t("Document name", "ឈ្មោះឯកសារ")}>
          <TextInput value={docName} onChange={(e) => setDocName(e.target.value)} />
        </Field>
        <Field label={t("Expiry date", "កាលបរិច្ឆេទផុតកំណត់")}>
          <TextInput type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label={t("Issued date (optional)", "កាលបរិច្ឆេទចេញ (ជាជម្រើស)")}>
          <TextInput type="date" value={issued} onChange={(e) => setIssued(e.target.value)} />
        </Field>
        <Field label={t("Travel-rule days before expiry", "ចំនួនថ្ងៃមុនផុតកំណត់សម្រាប់ការធ្វើដំណើរ")}>
          <TextInput type="number" min="0" step="1" value={ruleDays} onChange={(e) => setRuleDays(e.target.value)} />
        </Field>
      </Row>

      {status && result && (
        <div className={`rounded-md border p-4 ${status === "ok" ? "border-[var(--ground-line)] bg-[var(--ground-raised)]" : status === "rule" ? "border-amber-500/40 bg-amber-500/10" : "border-[var(--danger)]/40 bg-[var(--danger)]/10"}`}>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            {status === "ok" ? <CircleCheck size={16} className="text-[var(--success)]" /> : <AlertTriangle size={16} className={status === "rule" ? "text-amber-500" : "text-[var(--danger)]"} />}
            {status === "ok" ? t("Still valid", "នៅមានសុពលភាព") : status === "rule" ? t("Action needed soon", "ត្រូវធ្វើសកម្មភាពមិនយូរប៉ុន្មាន") : t("Expired", "បានផុតកំណត់")}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Days left", "ថ្ងៃនៅសល់")}</div>
              <div className="mt-1 text-xl font-bold text-[var(--ink)]">{result.remaining.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Months left", "ខែនៅសល់")}</div>
              <div className="mt-1 text-xl font-bold text-[var(--ink)]">{(result.remaining / 30.44).toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Expires", "ផុតកំណត់")}</div>
              <div className="mt-1 text-xl font-bold text-[var(--ink)]">{result.expires.toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Rule window", "រយៈពេលច្បាប់")}</div>
              <div className="mt-1 text-xl font-bold text-[var(--gold)]">{Number(ruleDays) || 0} {t("days", "ថ្ងៃ")}</div>
            </div>
          </div>
          {status === "rule" && (
            <p className="mt-3 text-xs leading-relaxed text-amber-700">
              {t(`This document falls within the ${ruleDays}-day window before expiry — many countries require a passport valid for at least that long on arrival. Renew it before booking travel.`, `ឯកសារនេះស្ថិតក្នុងរយៈពេល ${ruleDays} ថ្ងៃមុនផុតកំណត់ — ប្រទេសជាច្រើនតម្រូវឱ្យលិខិតឆ្លងដែននៅមានសុពលភាពយ៉ាងហោចណាស់ពេលនោះ នៅពេលមកដល់។ សូមបន្តវាមុនពេលកក់ការធ្វើដំណើរ។`)}
            </p>
          )}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
        {t("The 6-month rule (default 180 days) is a common entry requirement, but not universal — check the destination country's specific rules. Issued date is optional and shown for context only.", "ច្បាប់ ៦ ខែ (តាមលំនាំដើម ១៨០ ថ្ងៃ) ជាតម្រូវការចូលទូទៅ ប៉ុន្តែមិនមានគ្រប់ទីកន្លែង — សូមពិនិត្យតម្រូវការជាក់លាក់របស់ប្រទេសគោលដៅ។ កាលបរិច្ឆេទចេញ ជាជម្រើសដើម្បីបរិបទតែប៉ុណ្ណោះ។")}
      </p>
    </ToolShell>
  );
}
