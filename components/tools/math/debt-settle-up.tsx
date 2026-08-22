"use client";
import { Plus, Trash2 } from "lucide-react";
import { ToolShell, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Transfer {
  from: string;
  to: string;
  amount: number;
}

interface Person {
  name: string;
  amount: string;
}

function settle(nets: { name: string; net: number }[]): Transfer[] {
  const creditors = nets.filter((n) => n.net > 0.005).map((n) => ({ ...n })).sort((a, b) => b.net - a.net);
  const debtors = nets.filter((n) => n.net < -0.005).map((n) => ({ name: n.name, net: -n.net })).sort((a, b) => b.net - a.net);
  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].net, creditors[j].net);
    if (amount > 0.005) {
      transfers.push({ from: debtors[i].name, to: creditors[j].name, amount });
      debtors[i].net -= amount;
      creditors[j].net -= amount;
    }
    if (debtors[i].net <= 0.005) i++;
    if (creditors[j].net <= 0.005) j++;
  }
  return transfers;
}

export default function DebtSettleUp() {
  const { text: t } = useLanguage();
  const [people, setPeople] = useToolState<Person[]>("debt-settle-up:people", [
    { name: "Alice", amount: "90" },
    { name: "Bora", amount: "0" },
    { name: "Chen", amount: "30" },
  ]);

  const parsed = people.map((p) => ({ name: p.name.trim() || "?", paid: Number(p.amount) || 0 }));
  const total = parsed.reduce((s, p) => s + p.paid, 0);
  const share = parsed.length ? total / parsed.length : 0;
  const transfers = parsed.length >= 2 && total !== 0 ? settle(parsed.map((p) => ({ name: p.name, net: p.paid - share }))) : [];

  function update(index: number, patch: Partial<Person>) {
    setPeople((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <ToolShell
      title="Debt Settle-Up Splitter"
      khmerTitle="ការចែកចាយ និងបញ្ចុះបញ្ចូលបំណុល"
      description="Split shared expenses fairly and get the minimum set of transfers that settles everyone up."
      descriptionKm="ចែកចំណាយរួមយុត្តិធម៌ ហើយទទួលបានការផ្ទេរប្រាក់តិចតួចបំផុតដើម្បីបង់ប្រាក់គ្រប់គ្នា។"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          {people.map((person, i) => (
            <div key={i} className="flex items-center gap-2">
              <TextInput
                value={person.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder={t("Name", "ឈ្មោះ")}
                className="flex-1"
              />
              <TextInput
                inputMode="decimal"
                value={person.amount}
                onChange={(e) => update(i, { amount: e.target.value })}
                placeholder={t("Paid", "បានបង់")}
                className="w-32 font-mono-ui"
              />
              <button type="button" onClick={() => setPeople((prev) => prev.filter((_, idx) => idx !== i))} disabled={people.length <= 2} className="text-[var(--ink-faint)] hover:text-[var(--danger)] disabled:opacity-30">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={() => setPeople((prev) => [...prev, { name: "", amount: "0" }])} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] px-3 py-1.5 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)] hover:text-[var(--ink)]">
          <Plus size={13} />{t("Add person", "បន្ថែមមនុស្ស")}
        </button>

        <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-[var(--ink-dim)]">{t("Total expenses", "ចំណាយសរុប")}</span>
            <span className="font-mono-ui font-semibold text-[var(--ink)]">{money(total)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[var(--ink-dim)]">{t("Fair share each", "ចំណែកស្មើគ្នា")}</span>
            <span className="font-mono-ui text-[var(--ink)]">{money(share)}</span>
          </div>
        </div>

        {transfers.length > 0 ? (
          <div className="space-y-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-faint)]">{t("Settle up with these transfers", "បង់ប្រាក់តាមការផ្ទេរទាំងនេះ")}</div>
            {transfers.map((tr, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-[var(--danger)]">{tr.from}</span>
                <span className="text-[var(--ink-faint)]">→</span>
                <span className="font-semibold text-[var(--teal)]">{tr.to}</span>
                <span className="ml-auto font-mono-ui font-semibold tabular-nums text-[var(--ink)]">{money(tr.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          parsed.length >= 2 && (
            <div className="rounded-xl border border-[var(--teal)]/40 bg-[var(--teal)]/10 p-4 text-sm text-[var(--ink)]">
              {t("Everyone is settled up!", "អ្នកទាំងអស់គ្នាស្មើគ្នារួចរាល់!")}
            </div>
          )
        )}
      </div>
    </ToolShell>
  );
}