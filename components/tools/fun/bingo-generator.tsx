"use client";
import { useEffect, useState } from "react";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// Classic Bingo: B=1–15, I=16–30, N=31–45, G=46–60, O=61–75, with a FREE center.
const RANGES: [number, number][] = [
  [1, 15],
  [16, 30],
  [31, 45],
  [46, 60],
  [61, 75],
];
const LETTERS = ["B", "I", "N", "G", "O"];

// Column-major cells: index = column * 5 + row; index 12 is the FREE center.
function makeCard(): number[] {
  const cells: number[] = [];
  for (const [lo, hi] of RANGES) {
    const pool = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
    for (let k = 0; k < 5; k++) {
      const idx = Math.floor(Math.random() * pool.length);
      cells.push(pool.splice(idx, 1)[0]);
    }
  }
  return cells;
}

export default function BingoGenerator() {
  const { text: t } = useLanguage();
  const [quantity, setQuantity] = useToolState("bingo:quantity", "4");
  const [cards, setCards] = useState<number[][]>([]);

  const qty = Math.min(12, Math.max(1, Number(quantity) || 4));
  const regenerate = () => setCards(Array.from({ length: qty }, makeCard));

  useEffect(() => {
    // Generate the first set of cards after mount and regenerate when the
    // requested quantity changes (SSR-safe random cards).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity]);

  return (
    <ToolShell
      title="Bingo Card Generator"
      khmerTitle="បង្កើតកាតប៊ីងហ្គូ"
      description="Generate classic 5×5 Bingo cards and print a full A4 sheet for your game."
      descriptionKm="បង្កើតកាតប៊ីងហ្គូ ៥×៥ បុរាណ ហើយបោះពុម្ពសន្លឹក A4 សម្រាប់ការលេងរបស់អ្នក។"
    >
      <div className="space-y-4 print:hidden">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("Number of cards", "ចំនួនកាត")} hint={t("1–12", "១–១២")}>
            <Select value={quantity} onChange={(e) => setQuantity(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                <option key={n} value={String(n)}>{n}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={regenerate}>{t("Regenerate", "បង្កើតថ្មី")}</Button>
          <Button onClick={() => window.print()} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">
            {t("Print / PDF", "បោះពុម្ព / PDF")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
        {cards.map((card, ci) => (
          <div key={ci} className="rounded-md border border-[var(--ground-line)] bg-white p-2 print:break-inside-avoid print:border-neutral-400">
            <div className="grid grid-cols-5 gap-px text-center">
              {LETTERS.map((L) => (
                <div key={L} className="py-1 font-display text-sm font-bold text-neutral-900">{L}</div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-px">
              {card.map((n, i) => (
                <div
                  key={i}
                  className={`flex aspect-square items-center justify-center rounded-sm border border-neutral-300 font-mono-ui text-xs text-neutral-900 ${i === 12 ? "bg-amber-100 font-bold" : "bg-white"}`}
                >
                  {i === 12 ? t("FREE", "ទំនេរ") : n}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)] print:hidden">
        {t("Classic 1–75 Bingo with a FREE center. Regenerate for a fresh set, then print a sheet for classroom or family games.", "ប៊ីងហ្គូបុរាណ ១–៧៥ មានក្រឡា FREE នៅកណ្តាល។ បង្កើតថ្មីសម្រាប់កាតថ្មី រួចបោះពុម្ពសន្លឹកសម្រាប់លេងក្នុងថ្នាក់ ឬក្នុងគ្រួសារ។")}
      </p>
    </ToolShell>
  );
}
