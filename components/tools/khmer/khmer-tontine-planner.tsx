"use client";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Row, TextArea, TextInput, ToolShell } from "@/components/ui/Shell";
import { Pill, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { tontineSchedule } from "@/lib/khmer-money";

type Model = "fixed" | "bid";
type Currency = "USD" | "KHR";

const SAMPLE = "សុខា\nដារ៉ា\nវណ្ណា\nស្រីពៅ\nបុប្ផា";

/** Make names unique ("Sok", "Sok (2)") so one person can hold two hands. */
function uniqueNames(lines: string[]): string[] {
  const seen = new Map<string, number>();
  return lines.map((n) => {
    const c = (seen.get(n) ?? 0) + 1;
    seen.set(n, c);
    return c === 1 ? n : `${n} (${c})`;
  });
}

export default function KhmerTontinePlanner() {
  const { text: t } = useLanguage();
  const [membersText, setMembersText] = useToolState("khmer-tontine:members", SAMPLE);
  const [amount, setAmount] = useToolState("khmer-tontine:amount", "100");
  const [currency, setCurrency] = useToolState<Currency>("khmer-tontine:currency", "USD");
  const [model, setModel] = useToolState<Model>("khmer-tontine:model", "fixed");
  const [bids, setBids] = useToolState<string[]>("khmer-tontine:bids", []);

  const members = useMemo(() => uniqueNames(membersText.split("\n").map((s) => s.trim()).filter(Boolean)).slice(0, 50), [membersText]);
  const contribution = Math.max(0, Number(amount) || 0);
  // The final round has nobody left to discount for, so its bid is always 0.
  const plan = useMemo(() => tontineSchedule(members, contribution, model, members.map((_, i) => (i === members.length - 1 ? 0 : Number(bids[i]) || 0))), [members, contribution, model, bids]);
  const fmt = (n: number) => {
    const abs = Math.abs(n);
    const body = currency === "USD" ? `$${abs.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `${Math.round(abs).toLocaleString("en-US")} ៛`;
    return n < 0 ? `−${body}` : body;
  };
  const setBid = (i: number, v: string) => { const next = [...bids]; next[i] = v; setBids(next); };

  return (
    <ToolShell
      title="Khmer Tontine (ហ៊ុយ) Planner"
      khmerTitle="កម្មវិធីរៀបចំលេងហ៊ុយ"
      description="Plan a rotating savings group (ហ៊ុយ / tontine): list the members in payout order, set the amount each person puts in per round, and see who collects the pot each round, what everyone pays, and each member's total paid, received, and net. Supports a simple fixed rotation and a bid model where the round's recipient offers a discount to the members who haven't collected yet. A planning aid only — every group's rules differ, so agree yours in writing."
      descriptionKm="រៀបចំក្រុមសន្សំប្រាក់វិលជុំ (ហ៊ុយ)៖ រាយឈ្មោះសមាជិកតាមលំដាប់ទទួលប្រាក់ កំណត់ចំនួនដែលម្នាក់ៗដាក់ក្នុងមួយវគ្គ ហើយមើលថាអ្នកណាទទួលប្រាក់នៅវគ្គណា អ្នកណាបង់ប៉ុន្មាន និងសរុបដែលសមាជិកម្នាក់ៗបានបង់ បានទទួល និងចំណេញ/ខាត។ គាំទ្រការវិលជុំថេរធម្មតា និងម៉ូដែលដេញការប្រាក់ ដែលអ្នកទទួលប្រាក់វគ្គនោះផ្តល់ការបញ្ចុះដល់សមាជិកដែលមិនទាន់ទទួល។ ជាជំនួយរៀបចំផែនការតែប៉ុណ្ណោះ — ក្រុមនីមួយៗមានច្បាប់ខុសៗគ្នា ដូច្នេះសូមព្រមព្រៀងច្បាប់របស់អ្នកជាលាយលក្ខណ៍អក្សរ។"
    >
      <Row>
        <Field label="Members, in payout order (one per line)" labelKm="សមាជិក តាមលំដាប់ទទួលប្រាក់ (មួយក្នុងមួយបន្ទាត់)">
          <TextArea value={membersText} onChange={(e) => setMembersText(e.target.value)} rows={6} lang="km" className="font-khmer" />
        </Field>
        <div className="space-y-4">
          <Field label="Contribution per member per round" labelKm="ប្រាក់ដាក់ក្នុងម្នាក់ក្នុងមួយវគ្គ">
            <TextInput type="number" min={0} step="any" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <PillGroup label={t("Currency", "រូបិយប័ណ្ណ")}>
            <Pill active={currency === "USD"} onClick={() => setCurrency("USD")}>{t("US dollar ($)", "ដុល្លារ ($)")}</Pill>
            <Pill active={currency === "KHR"} onClick={() => setCurrency("KHR")}>{t("Riel (៛)", "រៀល (៛)")}</Pill>
          </PillGroup>
          <PillGroup label={t("Model", "ម៉ូដែល")}>
            <Pill active={model === "fixed"} onClick={() => setModel("fixed")}>{t("Fixed rotation", "វិលជុំថេរ")}</Pill>
            <Pill active={model === "bid"} onClick={() => setModel("bid")}>{t("Bid / discount", "ដេញការប្រាក់")}</Pill>
          </PillGroup>
        </div>
      </Row>

      <p className="text-xs leading-5 text-[var(--ink-faint)]">
        {model === "fixed"
          ? t("Fixed rotation: each round one member collects and everyone else pays the full contribution. Everyone ends up paying in exactly what they take out.", "វិលជុំថេរ៖ វគ្គនីមួយៗសមាជិកម្នាក់ទទួល ហើយអ្នកផ្សេងទៀតបង់ចំនួនពេញ។ ម្នាក់ៗបង់ចូលស្មើនឹងចំនួនដែលខ្លួនទទួល។")
          : t("Bid model: enter the discount (“interest”) the recipient offered for each round. Members who have NOT yet collected pay the contribution minus that discount; members who already collected pay the full amount. Collecting early costs more; collecting late earns the discounts.", "ម៉ូដែលដេញ៖ បញ្ចូលការបញ្ចុះ («ការប្រាក់») ដែលអ្នកទទួលបានផ្តល់សម្រាប់វគ្គនីមួយៗ។ សមាជិកដែលមិនទាន់ទទួល បង់ចំនួនដាក់ដកការបញ្ចុះនោះ ចំណែកសមាជិកដែលទទួលរួច បង់ចំនួនពេញ។ ទទួលមុនចំណាយច្រើនជាង ទទួលក្រោយបានការបញ្ចុះ។")}
      </p>

      {members.length < 2 ? (
        <p className="text-sm text-[var(--ink-faint)]">{t("Add at least two members.", "បន្ថែមសមាជិកយ៉ាងតិចពីរនាក់។")}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <thead className="bg-[var(--ground-raised)] text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                <tr>
                  <th className="px-3 py-2">{t("Round", "វគ្គ")}</th>
                  <th className="px-3 py-2">{t("Collects", "អ្នកទទួល")}</th>
                  {model === "bid" && <th className="px-3 py-2">{t("Discount bid", "ការបញ្ចុះ")}</th>}
                  <th className="px-3 py-2">{t("Each other member pays", "សមាជិកផ្សេងបង់")}</th>
                  <th className="px-3 py-2 text-right">{t("Pot", "ប្រាក់ទទួល")}</th>
                </tr>
              </thead>
              <tbody>
                {plan.rounds.map((r, i) => {
                  const amounts = [...new Set(r.payments.map((p) => p.amount))].sort((a, b) => b - a);
                  return (
                    <tr key={r.round} className="border-t border-[var(--ground-line)] align-top">
                      <td className="px-3 py-2 text-[var(--ink-dim)]">{r.round}</td>
                      <td lang="km" className="px-3 py-2 font-khmer text-[var(--ink)]">{r.recipient}</td>
                      {model === "bid" && (
                        <td className="px-3 py-2">
                          {i === plan.rounds.length - 1
                            ? <span className="text-xs text-[var(--ink-faint)]">{t("last — no bid", "ចុងក្រោយ — គ្មានការដេញ")}</span>
                            : <TextInput type="number" min={0} step="any" inputMode="decimal" value={bids[i] ?? ""} onChange={(e) => setBid(i, e.target.value)} className="w-24" aria-label={t(`Discount for round ${r.round}`, `ការបញ្ចុះវគ្គ ${r.round}`)} />}
                        </td>
                      )}
                      <td className="px-3 py-2 text-[var(--ink-dim)]">
                        {amounts.map((a) => {
                          const who = r.payments.filter((p) => p.amount === a).length;
                          return <span key={a} className="block">{t(`${who} × ${fmt(a)}`, `${who} នាក់ × ${fmt(a)}`)}</span>;
                        })}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-[var(--ink)]">{fmt(r.pot)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="bg-[var(--ground-raised)] text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                <tr>
                  <th className="px-3 py-2">{t("Member", "សមាជិក")}</th>
                  <th className="px-3 py-2 text-right">{t("Total paid", "បង់សរុប")}</th>
                  <th className="px-3 py-2 text-right">{t("Received", "ទទួលបាន")}</th>
                  <th className="px-3 py-2 text-right">{t("Net", "ចំណេញ/ខាត")}</th>
                </tr>
              </thead>
              <tbody>
                {plan.members.map((m) => (
                  <tr key={m.name} className="border-t border-[var(--ground-line)]">
                    <td lang="km" className="px-3 py-2 font-khmer text-[var(--ink)]">{m.name}</td>
                    <td className="px-3 py-2 text-right text-[var(--ink-dim)]">{fmt(m.paid)}</td>
                    <td className="px-3 py-2 text-right text-[var(--ink-dim)]">{fmt(m.received)}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${m.net > 0 ? "text-[var(--gold)]" : m.net < 0 ? "text-[var(--danger)]" : "text-[var(--ink)]"}`}>{m.net > 0 ? "+" : ""}{fmt(m.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="rounded-md border border-[var(--ground-line)] p-3 text-xs leading-5 text-[var(--ink-dim)]">
        {t(
          "Informal savings groups carry real risk — if the organiser or a member who has already collected stops paying, others can lose money. This tool only does the arithmetic; it isn't financial or legal advice.",
          "ក្រុមសន្សំក្រៅប្រព័ន្ធមានហានិភ័យពិតប្រាកដ — ប្រសិនបើមេហ៊ុយ ឬសមាជិកដែលទទួលរួចឈប់បង់ អ្នកផ្សេងអាចខាតប្រាក់។ ឧបករណ៍នេះគ្រាន់តែគណនាលេខប៉ុណ្ណោះ មិនមែនជាដំបូន្មានហិរញ្ញវត្ថុ ឬផ្លូវច្បាប់ទេ។",
        )}
      </p>

      <SourceCredits>
        <p>{t(
          "Implements two textbook rotating savings and credit association (ROSCA) arrangements: a fixed-order rotation, and a discount-bid rotation where members who have not yet collected pay the contribution minus the round's bid. In this model the recipient pays nothing in the round they collect; real ហ៊ុយ groups vary (organiser fees, the recipient also paying, interest paid on top rather than discounted), so adjust the numbers to your group's agreement. All figures are exactly what you enter. Original Tools123 implementation.",
          "អនុវត្តការរៀបចំក្រុមសន្សំ និងឥណទានវិលជុំ (ROSCA) ពីរបែបដែលគេស្គាល់ទូទៅ៖ ការវិលជុំតាមលំដាប់ថេរ និងការវិលជុំដេញការបញ្ចុះ ដែលសមាជិកមិនទាន់ទទួលបង់ចំនួនដាក់ដកការដេញនៃវគ្គនោះ។ ក្នុងម៉ូដែលនេះ អ្នកទទួលមិនបង់ក្នុងវគ្គដែលខ្លួនទទួលទេ។ ក្រុមហ៊ុយពិតៗខុសគ្នា (កម្រៃមេហ៊ុយ អ្នកទទួលក៏បង់ដែរ ការប្រាក់បង់បន្ថែមជំនួសការបញ្ចុះ) ដូច្នេះសូមកែលេខតាមកិច្ចព្រមព្រៀងក្រុមរបស់អ្នក។ តួលេខទាំងអស់គឺដូចអ្វីដែលអ្នកបញ្ចូល។ ការអនុវត្តដើមរបស់ Tools123។",
        )}</p>
      </SourceCredits>
    </ToolShell>
  );
}
