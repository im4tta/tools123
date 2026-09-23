"use client";
import { useMemo, useState } from "react";
import { Download, Printer, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Row, TextInput, ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { downloadBlob } from "@/lib/download";

type Side = "bride" | "groom" | "family" | "other";
interface Gift { id: string; name: string; side: Side; usd: number; khr: number; note: string }

const SIDES: { id: Side; en: string; km: string }[] = [
  { id: "bride", en: "Bride's side", km: "ខាងកូនក្រមុំ" },
  { id: "groom", en: "Groom's side", km: "ខាងកូនកំលោះ" },
  { id: "family", en: "Family", km: "គ្រួសារ" },
  { id: "other", en: "Other", km: "ផ្សេងៗ" },
];

const KH = "០១២៣៤៥៦៧៨៩";
const kh = (s: string) => s.replace(/\d/g, (d) => KH[Number(d)]);
const usdFmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const khrFmt = (n: number) => `${Math.round(n).toLocaleString("en-US")} ៛`;
const csvCell = (v: string | number) => {
  const s = String(v);
  // Quote, and neutralise leading = + - @ so spreadsheets don't run it as a formula.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export default function KhmerGiftLedger() {
  const { text: t } = useLanguage();
  const [event, setEvent] = useToolState("khmer-gift-ledger:event", "");
  const [gifts, setGifts] = useToolState<Gift[]>("khmer-gift-ledger:gifts", []);
  const [rate, setRate] = useToolState("khmer-gift-ledger:rate", "");
  const [name, setName] = useState("");
  const [side, setSide] = useState<Side>("bride");
  const [usd, setUsd] = useState("");
  const [khr, setKhr] = useState("");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const add = () => {
    const u = Math.max(0, Number(usd) || 0);
    const k = Math.max(0, Number(khr) || 0);
    if (!name.trim() || (u === 0 && k === 0)) return;
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    setGifts([{ id, name: name.trim(), side, usd: u, khr: k, note: note.trim() }, ...gifts]);
    setName(""); setUsd(""); setKhr(""); setNote("");
  };
  const remove = (id: string) => setGifts(gifts.filter((g) => g.id !== id));

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? gifts.filter((g) => g.name.toLowerCase().includes(q) || g.note.toLowerCase().includes(q)) : gifts;
  }, [gifts, filter]);

  const totals = useMemo(() => {
    const bySide = new Map<Side, { usd: number; khr: number; count: number }>();
    let u = 0, k = 0;
    for (const g of gifts) {
      u += g.usd; k += g.khr;
      const s = bySide.get(g.side) ?? { usd: 0, khr: 0, count: 0 };
      bySide.set(g.side, { usd: s.usd + g.usd, khr: s.khr + g.khr, count: s.count + 1 });
    }
    return { usd: u, khr: k, bySide };
  }, [gifts]);
  const r = Number(rate);
  const combinedUsd = r > 0 ? totals.usd + totals.khr / r : null;

  const exportCsv = () => {
    const header = ["Name", "Side", "USD", "KHR", "Note"].map(csvCell).join(",");
    const rows = gifts.map((g) => [g.name, SIDES.find((s) => s.id === g.side)?.en ?? g.side, g.usd, g.khr, g.note].map(csvCell).join(","));
    // BOM so Excel opens the Khmer text as UTF-8.
    downloadBlob(new Blob(["﻿" + [header, ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" }), `${(event.trim() || "gift-ledger").replace(/[\\/:*?"<>|]+/g, "-")}.csv`);
  };

  return (
    <ToolShell
      title="Khmer Wedding Gift Ledger"
      khmerTitle="បញ្ជីកត់ត្រាចំណងដៃ"
      description="Keep a tidy record of the envelopes (ចំណងដៃ) you receive at a wedding, housewarming, or ceremony: guest name, which side they came with, and the amount in dollars and/or riel. See running totals by side, search the list, export to Excel/CSV, or print it — handy later when it's your turn to return the kindness. Everything is saved only in this browser on this device; nothing is uploaded."
      descriptionKm="កត់ត្រាស្រោមសំបុត្រ (ចំណងដៃ) ដែលអ្នកទទួលបាននៅពិធីមង្គលការ ឡើងផ្ទះថ្មី ឬពិធីផ្សេងៗឱ្យមានសណ្តាប់ធ្នាប់៖ ឈ្មោះភ្ញៀវ ខាងណា និងចំនួនជាដុល្លារ និង/ឬរៀល។ មើលចំនួនសរុបតាមខាង ស្វែងរកក្នុងបញ្ជី នាំចេញទៅ Excel/CSV ឬបោះពុម្ព — ងាយស្រួលពេលក្រោយនៅពេលដល់វេនអ្នកតបស្នង។ អ្វីៗរក្សាទុកតែក្នុងកម្មវិធីរុករកនៅលើឧបករណ៍នេះប៉ុណ្ណោះ គ្មានការផ្ញើឡើងទេ។"
    >
      <Field label="Event name (optional)" labelKm="ឈ្មោះកម្មវិធី (ជម្រើស)">
        <TextInput value={event} onChange={(e) => setEvent(e.target.value)} lang="km" className="font-khmer" placeholder="e.g. Sokha & Dara wedding" />
      </Field>

      <form className="space-y-3 rounded-md border border-[var(--ground-line)] p-4" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <Row>
          <Field label="Guest name" labelKm="ឈ្មោះភ្ញៀវ">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} lang="km" className="font-khmer" autoComplete="off" />
          </Field>
          <Field label="Note (optional)" labelKm="កំណត់ចំណាំ (ជម្រើស)">
            <TextInput value={note} onChange={(e) => setNote(e.target.value)} lang="km" className="font-khmer" autoComplete="off" />
          </Field>
          <Field label="Amount in USD ($)" labelKm="ចំនួនជាដុល្លារ ($)">
            <TextInput type="number" min={0} step="any" inputMode="decimal" value={usd} onChange={(e) => setUsd(e.target.value)} />
          </Field>
          <Field label="Amount in KHR (៛)" labelKm="ចំនួនជារៀល (៛)">
            <TextInput type="number" min={0} step="100" inputMode="numeric" value={khr} onChange={(e) => setKhr(e.target.value)} />
          </Field>
        </Row>
        <PillGroup label={t("Side", "ខាង")}>
          {SIDES.map((s) => <Pill key={s.id} active={side === s.id} onClick={() => setSide(s.id)}>{t(s.en, s.km)}</Pill>)}
        </PillGroup>
        <Button type="submit" disabled={!name.trim() || (!(Number(usd) > 0) && !(Number(khr) > 0))}>{t("Add gift", "បន្ថែមចំណងដៃ")}</Button>
      </form>

      <div id="khmer-gift-ledger-print" className="space-y-4">
        {event.trim() && <h2 lang="km" className="font-khmer text-lg font-semibold text-[var(--ink)]">{event}</h2>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t("Guests", "ភ្ញៀវ")} value={t(String(gifts.length), kh(String(gifts.length)))} />
          <Stat label={t("Total USD", "សរុបដុល្លារ")} value={usdFmt(totals.usd)} />
          <Stat label={t("Total KHR", "សរុបរៀល")} value={khrFmt(totals.khr)} />
          <Stat label={t("Combined (at your rate)", "សរុបរួម (តាមអត្រារបស់អ្នក)")} value={combinedUsd === null ? "—" : usdFmt(Math.round(combinedUsd * 100) / 100)} />
        </div>
        {totals.bySide.size > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-dim)]">
            {SIDES.filter((s) => totals.bySide.has(s.id)).map((s) => {
              const v = totals.bySide.get(s.id)!;
              return <span key={s.id} className="rounded border border-[var(--ground-line)] px-2 py-1">{t(s.en, s.km)}: {v.count} · {usdFmt(v.usd)} · {khrFmt(v.khr)}</span>;
            })}
          </div>
        )}

        {gifts.length === 0 ? (
          <p className="text-xs text-[var(--ink-faint)]">{t("No gifts recorded yet. Add the first envelope above.", "មិនទាន់មានការកត់ត្រានៅឡើយ។ បន្ថែមស្រោមសំបុត្រដំបូងខាងលើ។")}</p>
        ) : (
          <>
            <div className="print:hidden">
              <Field label="Search" labelKm="ស្វែងរក">
                <TextInput value={filter} onChange={(e) => setFilter(e.target.value)} lang="km" className="font-khmer" />
              </Field>
            </div>
            <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="bg-[var(--ground-raised)] text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                  <tr>
                    <th className="px-3 py-2">{t("Name", "ឈ្មោះ")}</th>
                    <th className="px-3 py-2">{t("Side", "ខាង")}</th>
                    <th className="px-3 py-2 text-right">USD</th>
                    <th className="px-3 py-2 text-right">KHR</th>
                    <th className="px-3 py-2">{t("Note", "កំណត់ចំណាំ")}</th>
                    <th className="px-3 py-2 print:hidden"><span className="sr-only">{t("Delete", "លុប")}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((g) => (
                    <tr key={g.id} className="border-t border-[var(--ground-line)]">
                      <td lang="km" className="px-3 py-2 font-khmer text-[var(--ink)]">{g.name}</td>
                      <td className="px-3 py-2 text-[var(--ink-dim)]">{(() => { const s = SIDES.find((x) => x.id === g.side); return s ? t(s.en, s.km) : g.side; })()}</td>
                      <td className="px-3 py-2 text-right text-[var(--ink)]">{g.usd ? usdFmt(g.usd) : "—"}</td>
                      <td className="px-3 py-2 text-right text-[var(--ink)]">{g.khr ? khrFmt(g.khr) : "—"}</td>
                      <td lang="km" className="px-3 py-2 font-khmer text-[var(--ink-dim)]">{g.note}</td>
                      <td className="px-3 py-2 text-right print:hidden">
                        <button type="button" onClick={() => remove(g.id)} className="text-[var(--ink-faint)] hover:text-[var(--danger)]" aria-label={t(`Delete ${g.name}`, `លុប ${g.name}`)}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Row>
        <Field label="Riel per 1 USD (optional, for the combined total)" labelKm="រៀលក្នុង ១ ដុល្លារ (ជម្រើស សម្រាប់ចំនួនសរុបរួម)" hint="Enter the rate you use" hintKm="បញ្ចូលអត្រាដែលអ្នកប្រើ">
          <TextInput type="number" min={0} inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </Row>

      <div className="flex flex-wrap items-center gap-2">
        <PillAction onClick={exportCsv} disabled={gifts.length === 0}><Download size={13} />{t("Export CSV", "នាំចេញ CSV")}</PillAction>
        <PillAction onClick={() => window.print()} disabled={gifts.length === 0}><Printer size={13} />{t("Print", "បោះពុម្ព")}</PillAction>
        {confirmClear ? (
          <>
            <span className="text-xs text-[var(--danger)]">{t("Delete every entry?", "លុបការកត់ត្រាទាំងអស់?")}</span>
            <PillAction onClick={() => { setGifts([]); setConfirmClear(false); }}>{t("Yes, delete all", "បាទ/ចាស លុបទាំងអស់")}</PillAction>
            <PillAction onClick={() => setConfirmClear(false)}>{t("Cancel", "បោះបង់")}</PillAction>
          </>
        ) : (
          <PillAction onClick={() => setConfirmClear(true)} disabled={gifts.length === 0}><Trash2 size={13} />{t("Clear all", "លុបទាំងអស់")}</PillAction>
        )}
      </div>
      <p className="text-xs text-[var(--ink-faint)]">{t("Your list is saved in this browser only. Clearing site data or switching devices loses it — export a CSV as a backup.", "បញ្ជីរបស់អ្នករក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។ ការសម្អាតទិន្នន័យគេហទំព័រ ឬប្តូរឧបករណ៍នឹងបាត់វា — សូមនាំចេញ CSV ទុកជាបម្រុង។")}</p>
      <style jsx global>{`@media print { body * { visibility: hidden !important; } #khmer-gift-ledger-print, #khmer-gift-ledger-print * { visibility: visible !important; } #khmer-gift-ledger-print { position: absolute; inset: 0; width: 100%; background: #fff; color: #000; padding: 10mm; } @page { size: A4 portrait; margin: 12mm; } }`}</style>

      <SourceCredits>
        <p>{t(
          "A simple private ledger: amounts are exactly what you type, totals are plain sums, and the combined total uses only the exchange rate you enter — no rate is fetched or assumed. The CSV is UTF-8 with a byte-order mark so Excel shows Khmer names correctly, and cells that start with = + - @ are prefixed so spreadsheets don't treat them as formulas. Original Tools123 implementation.",
          "បញ្ជីកត់ត្រាឯកជនសាមញ្ញ៖ ចំនួនប្រាក់គឺដូចអ្វីដែលអ្នកវាយ ចំនួនសរុបជាការបូកធម្មតា ហើយចំនួនសរុបរួមប្រើតែអត្រាប្តូរប្រាក់ដែលអ្នកបញ្ចូលប៉ុណ្ណោះ — គ្មានអត្រាត្រូវទាញយក ឬសន្មតទេ។ ឯកសារ CSV ជា UTF-8 មាន BOM ដើម្បីឱ្យ Excel បង្ហាញឈ្មោះខ្មែរត្រឹមត្រូវ ហើយក្រឡាដែលចាប់ផ្តើមដោយ = + - @ ត្រូវបន្ថែមសញ្ញាពីមុខ ដើម្បីកុំឱ្យកម្មវិធីតារាងចាត់ទុកជារូបមន្ត។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
      <div className="text-xs text-[var(--ink-faint)]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{value}</div>
    </div>
  );
}
