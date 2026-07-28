"use client";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface Entry {
  id: string;
  desc: string;
  amount: number;
  category: string;
  date: string;
}

const CATEGORIES = ["Food", "Transport", "Housing", "Utilities", "Health", "Shopping", "Other"];

export default function ExpenseTracker() {
  const [entries, setEntries] = useToolState<Entry[]>("expense-tracker:entries", []);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  function addEntry() {
    const n = Number(amount);
    if (!desc.trim() || isNaN(n) || n === 0) return;
    setEntries((prev) => [
      { id: crypto.randomUUID(), desc: desc.trim(), amount: n, category, date: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
    setDesc("");
    setAmount("");
  }

  function remove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const total = useMemo(() => entries.reduce((sum, e) => sum + e.amount, 0), [entries]);
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) map.set(e.category, (map.get(e.category) || 0) + e.amount);
    return Array.from(map.entries()).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  }, [entries]);

  return (
    <ToolShell
      title="Expense Tracker"
      description="A minimalist expense log — add entries, tag a category, and see totals. Kept entirely in this browser's local storage, nothing is sent anywhere."
    >
      <Row>
        <Field label="Description">
          <TextInput value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Coffee, rent, taxi…" onKeyDown={(e) => e.key === "Enter" && addEntry()} />
        </Field>
        <Field label="Amount">
          <TextInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="-4.50" onKeyDown={(e) => e.key === "Enter" && addEntry()} />
        </Field>
      </Row>
      <Row>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <div className="flex items-end">
          <Button onClick={addEntry} className="w-full">Add entry</Button>
        </div>
      </Row>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 text-sm">
        <span className="text-[var(--ink-dim)]">Net total: </span>
        <span className={`font-mono-ui font-medium ${total < 0 ? "text-[var(--danger)]" : "text-[var(--ink)]"}`}>{total.toFixed(2)}</span>
      </div>

      {byCategory.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {byCategory.map(([cat, sum]) => (
            <span key={cat} className="rounded-full border border-[var(--ground-line)] px-2.5 py-1 text-xs text-[var(--ink-dim)]">
              {cat}: <span className="font-mono-ui text-[var(--ink)]">{sum.toFixed(2)}</span>
            </span>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        {entries.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--ink-faint)]">No entries yet — add one above.</div>
        )}
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm">
            <div>
              <div className="text-[var(--ink)]">{e.desc}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{e.category} · {e.date}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-mono-ui text-sm ${e.amount < 0 ? "text-[var(--danger)]" : "text-[var(--ink)]"}`}>{e.amount.toFixed(2)}</span>
              <button type="button" onClick={() => remove(e.id)} aria-label="Delete entry" className="text-[var(--ink-faint)] hover:text-[var(--danger)]">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}
