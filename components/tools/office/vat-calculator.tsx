"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function VatCalculator() {
  const { text: t } = useLanguage();
  const [amount, setAmount] = useToolState("vat:amount", "100000");
  const [rate, setRate] = useToolState("vat:rate", "10");
  const [mode, setMode] = useToolState("vat:mode", "exclude");
  const [currency, setCurrency] = useToolState("vat:currency", "khr");

  const fmt = (n: number) =>
    Math.round(n).toLocaleString("en-US") + (currency === "usd" ? " $" : " ៛");

  const calc = useMemo(() => {
    const a = Number(amount);
    const r = Number(rate);
    if (Number.isNaN(a) || a < 0 || Number.isNaN(r) || r < 0) return null;
    if (mode === "exclude") {
      const vat = a * (r / 100);
      return { net: a, vat, gross: a + vat };
    }
    const net = a / (1 + r / 100);
    return { net, vat: a - net, gross: a };
  }, [amount, rate, mode]);

  return (
    <ToolShell
      title="VAT Calculator"
      khmerTitle="គណនាអាករលើតម្លៃបន្ថែម"
      description="Add or extract VAT (default 10% Cambodia) from any amount."
      descriptionKm="បន្ថែម ឬដកអាករលើតម្លៃបន្ថែម (លំនាំដើម ១០% កម្ពុជា) ពីចំនួនទឹកប្រាក់ណាមួយ។"
    >
      <Row>
        <Field label={t("Amount", "ចំនួនទឹកប្រាក់")}>
          <TextInput inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label={t("VAT rate (%)", "អត្រាអាករ (%)")}>
          <Select value={rate} onChange={(e) => setRate(e.target.value)}>
            <option value="0">0%</option>
            <option value="5">5%</option>
            <option value="10">10% {t("(Cambodia standard)", "(ស្ដង់ដារកម្ពុជា)")}</option>
            <option value="15">15%</option>
            <option value="20">20%</option>
          </Select>
        </Field>
        <Field label={t("Mode", "របៀប")}>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="exclude">{t("Amount excludes VAT", "ចំនួនគ្មានអាករ")}</option>
            <option value="include">{t("Amount includes VAT", "ចំនួនរាប់អាករហើយ")}</option>
          </Select>
        </Field>
        <Field label={t("Currency", "រូបិយប័ណ្ណ")}>
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="khr">៛ Riel</option>
            <option value="usd">$ USD</option>
          </Select>
        </Field>
      </Row>

      {calc ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Net (excl. VAT)", "សុទ្ធ (គ្មានអាករ)")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{fmt(calc.net)}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("VAT amount", "ចំនួនអាករ")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--gold)]">{fmt(calc.vat)}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Gross (incl. VAT)", "សរុប (រាប់អាករ)")}</div>
            <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{fmt(calc.gross)}</div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter a valid amount.", "សូមបញ្ចូលចំនួនទឹកប្រាក់ឱ្យបានត្រឹមត្រូវ។")}</p>
      )}
    </ToolShell>
  );
}