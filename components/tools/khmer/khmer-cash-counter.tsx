"use client";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { PillAction } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { CopyButton } from "@/components/CopyButton";
import { useToolState } from "@/lib/storage";
import { DEFAULT_RIEL_DENOMS, DEFAULT_USD_DENOMS, cashTotal, parseDenoms } from "@/lib/khmer-money";
import { toKhmerNumerals } from "@/lib/khmer-number-words";

const fmt = (n: number) => n.toLocaleString("en-US");
const fmtKh = (n: number) => toKhmerNumerals(fmt(n));

function CountRow({ label, count, onChange, subtotal }: { label: string; count: number; onChange: (n: number) => void; subtotal: string }) {
  const { text: t } = useLanguage();
  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="font-mono-ui text-sm font-medium text-[var(--ink)]">{label}</p>
        <p className="truncate font-mono-ui text-xs text-[var(--ink-faint)]">= {subtotal}</p>
      </div>
      <button type="button" onClick={() => onChange(Math.max(0, count - 1))} aria-label={t(`One fewer ${label}`, `ដក ${label} មួយ`)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[var(--ground-line)] text-[var(--ink-dim)]"><Minus size={16} /></button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={count || ""}
        placeholder="0"
        onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
        aria-label={t(`Number of ${label} notes`, `ចំនួនក្រដាស ${label}`)}
        className="h-11 w-14 shrink-0 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] text-center font-mono-ui text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]"
      />
      <button type="button" onClick={() => onChange(count + 1)} aria-label={t(`One more ${label}`, `បន្ថែម ${label} មួយ`)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[var(--ground-line)] text-[var(--ink-dim)]"><Plus size={16} /></button>
    </div>
  );
}

export default function KhmerCashCounter() {
  const { text: t } = useLanguage();
  const [rielDenoms, setRielDenoms] = useToolState("khmer-cash-counter:riel-denoms", DEFAULT_RIEL_DENOMS);
  const [usdDenoms, setUsdDenoms] = useToolState("khmer-cash-counter:usd-denoms", DEFAULT_USD_DENOMS);
  const [riel, setRiel] = useToolState<Record<string, number>>("khmer-cash-counter:riel", {});
  const [usd, setUsd] = useToolState<Record<string, number>>("khmer-cash-counter:usd", {});
  const [rate, setRate] = useToolState("khmer-cash-counter:rate", "");

  const rielResult = cashTotal(riel, parseDenoms(rielDenoms));
  const usdResult = cashTotal(usd, parseDenoms(usdDenoms));
  const rateNum = Number(rate);
  const hasRate = Number.isFinite(rateNum) && rateNum > 0;
  const combinedRiel = hasRate ? rielResult.total + usdResult.total * rateNum : null;

  const summary = [
    ...rielResult.rows.filter((r) => r.count).map((r) => `${fmt(r.denom)}៛ × ${r.count} = ${fmt(r.subtotal)}៛`),
    `${t("Riel total", "សរុបរៀល")}: ${fmt(rielResult.total)}៛`,
    ...usdResult.rows.filter((r) => r.count).map((r) => `$${fmt(r.denom)} × ${r.count} = $${fmt(r.subtotal)}`),
    `${t("Dollar total", "សរុបដុល្លារ")}: $${fmt(usdResult.total)}`,
    ...(combinedRiel != null ? [`${t("All in riel", "សរុបជារៀល")} (${t("rate", "អត្រា")} ${fmt(rateNum)}): ${fmt(Math.round(combinedRiel))}៛`] : []),
  ].join("\n");

  const reset = () => {
    if (!window.confirm(t("Clear all counts?", "លុបចំនួនទាំងអស់?"))) return;
    setRiel({}); setUsd({});
  };

  return (
    <ToolShell
      title="Riel & Dollar Cash Counter"
      khmerTitle="កម្មវិធីរាប់ប្រាក់សុទ្ធ រៀល និងដុល្លារ"
      description="Count a pile of cash quickly: tap + / − or type how many notes of each value you have, and get the riel and dollar totals instantly — handy for closing a shop till, wedding envelopes or a tontine round. Add your own exchange rate to see everything in riel."
      descriptionKm="រាប់ប្រាក់ឱ្យបានលឿន៖ ចុច + / − ឬវាយចំនួនក្រដាសប្រាក់នៃតម្លៃនីមួយៗ ហើយទទួលបានសរុបរៀល និងដុល្លារភ្លាមៗ — ងាយស្រួលសម្រាប់បិទបញ្ជីហាង ស្រោមសំបុត្រការ ឬជុំហ៊ុយ។ បញ្ចូលអត្រាប្តូរប្រាក់របស់អ្នកផ្ទាល់ ដើម្បីមើលទាំងអស់ជារៀល។"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-[var(--gold)] p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-[var(--ink-dim)]">{t("Riel", "រៀល")}</p>
          <p className="font-display text-2xl text-[var(--ink)]">{fmt(rielResult.total)}៛</p>
          <p lang="km" className="font-khmer text-sm text-[var(--ink-faint)]">{fmtKh(rielResult.total)} ៛ · {t(`${rielResult.notes} notes`, `${toKhmerNumerals(String(rielResult.notes))} សន្លឹក`)}</p>
        </div>
        <div className="rounded-md border border-[var(--gold)] p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-[var(--ink-dim)]">{t("Dollars", "ដុល្លារ")}</p>
          <p className="font-display text-2xl text-[var(--ink)]">${fmt(usdResult.total)}</p>
          <p className="text-sm text-[var(--ink-faint)]">{t(`${usdResult.notes} notes`, `${toKhmerNumerals(String(usdResult.notes))} សន្លឹក`)}</p>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-[var(--ink-dim)]">{t("All in riel", "សរុបជារៀល")}</p>
          <p className="font-display text-2xl text-[var(--ink)]">{combinedRiel != null ? `${fmt(Math.round(combinedRiel))}៛` : "—"}</p>
          <p className="text-sm text-[var(--ink-faint)]">{hasRate ? t(`at ${fmt(rateNum)} riel per dollar`, `អត្រា ${fmtKh(rateNum)} រៀលក្នុងមួយដុល្លារ`) : t("Enter a rate below", "បញ្ចូលអត្រាខាងក្រោម")}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Riel notes", "ក្រដាសប្រាក់រៀល")}</h3>
          {rielResult.rows.map((r) => (
            <CountRow key={r.denom} label={`${fmt(r.denom)}៛`} count={r.count} subtotal={`${fmt(r.subtotal)}៛`} onChange={(n) => setRiel({ ...riel, [r.denom]: n })} />
          ))}
        </section>
        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Dollar notes", "ក្រដាសប្រាក់ដុល្លារ")}</h3>
          {usdResult.rows.map((r) => (
            <CountRow key={r.denom} label={`$${fmt(r.denom)}`} count={r.count} subtotal={`$${fmt(r.subtotal)}`} onChange={(n) => setUsd({ ...usd, [r.denom]: n })} />
          ))}
        </section>
      </div>

      <Row>
        <Field label="Your exchange rate (riel per $1)" labelKm="អត្រាប្តូរប្រាក់របស់អ្នក (រៀលក្នុង $១)" hint="Optional. Type the rate you actually use; nothing is filled in for you." hintKm="ស្រេចចិត្ត។ វាយអត្រាដែលអ្នកប្រើពិតប្រាកដ គ្មានអ្វីបំពេញជំនួសអ្នកទេ។">
          <TextInput inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder={t("Riel per $1", "រៀលក្នុង $១")} />
        </Field>
        <div className="flex items-end gap-2">
          <CopyButton text={summary} />
          <PillAction onClick={reset}><RotateCcw size={13} />{t("Clear counts", "លុបចំនួន")}</PillAction>
        </div>
      </Row>

      <details className="rounded-md border border-[var(--ground-line)] px-3 py-2 text-sm">
        <summary className="cursor-pointer py-1 text-[var(--ink-dim)]">{t("Edit note values", "កែតម្លៃក្រដាសប្រាក់")}</summary>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Field label="Riel note values" labelKm="តម្លៃក្រដាសប្រាក់រៀល"><TextInput value={rielDenoms} onChange={(e) => setRielDenoms(e.target.value)} /></Field>
          <Field label="Dollar note values" labelKm="តម្លៃក្រដាសប្រាក់ដុល្លារ"><TextInput value={usdDenoms} onChange={(e) => setUsdDenoms(e.target.value)} /></Field>
        </div>
      </details>

      <SourceCredits>
        <p>{t(
          "The starting note values are the commonly circulating riel and US dollar notes, the same editable defaults used by the app's Riel Cash Breakdown and Mixed Change tools (lib/khmer-money.ts). They are a convenience, not an official list — edit them to match what you hold. No exchange rate is built in: the rate is always the one you type. Counts are saved in this browser only. Original Tools123 implementation.",
          "តម្លៃក្រដាសប្រាក់ដំបូងគឺក្រដាសប្រាក់រៀល និងដុល្លារអាមេរិកដែលចរាចរទូទៅ ដូចគ្នានឹងតម្លៃលំនាំដើមដែលអាចកែបាន ក្នុងឧបករណ៍បំបែកប្រាក់រៀល និងឧបករណ៍គិតប្រាក់អាប់ចម្រុះរបស់កម្មវិធី (lib/khmer-money.ts)។ ពួកវាគ្រាន់តែជាភាពងាយស្រួល មិនមែនជាបញ្ជីផ្លូវការទេ — សូមកែឱ្យត្រូវនឹងអ្វីដែលអ្នកមាន។ គ្មានអត្រាប្តូរប្រាក់ដាក់ស្រាប់ទេ៖ អត្រាតែងតែជាអត្រាដែលអ្នកវាយ។ ចំនួនរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
