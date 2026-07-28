"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

// A bank of common, everyday Khmer words — not tied to any particular
// meaning as a set, just realistic vocabulary so mockups look like real
// Khmer copy rather than the Latin "Lorem ipsum" placeholder text most
// design tools default to (which renders oddly next to Khmer UI chrome).
const WORDS = [
  "ខ្ញុំ", "អ្នក", "គាត់", "យើង", "ពួកគេ", "ផ្ទះ", "ការងារ", "ស្រុក", "ទីក្រុង",
  "ភ្នំពេញ", "ខេត្ត", "ថ្ងៃ", "ខែ", "ឆ្នាំ", "ព្រឹក", "ល្ងាច", "អាហារ", "ទឹក",
  "សាលារៀន", "សិស្ស", "គ្រូ", "សៀវភៅ", "ភាសា", "ខ្មែរ", "កម្ពុជា", "វប្បធម៌",
  "ប្រវត្តិសាស្ត្រ", "សេដ្ឋកិច្ច", "អាជីវកម្ម", "ក្រុមហ៊ុន", "អតិថិជន", "សេវាកម្ម",
  "គម្រោង", "សំណង់", "ផ្លូវ", "ស្ពាន", "ទីផ្សារ", "លុយ", "ការទូទាត់", "ធនាគារ",
  "កុំព្យូទ័រ", "ទូរស័ព្ទ", "អ៊ីនធឺណិត", "គេហទំព័រ", "រូបភាព", "តន្ត្រី", "ភាពយន្ត",
  "សុខភាព", "គ្រូពេទ្យ", "មន្ទីរពេទ្យ", "អាកាសធាតុ", "ភ្លៀង", "ថ្ងៃរះ", "ស្រស់ស្អាត",
  "ធំ", "តូច", "ល្អ", "ថ្មី", "ចាស់", "លឿន", "យឺត", "សប្បាយ", "រីករាយ",
];

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sentence(minWords = 5, maxWords = 11) {
  const n = minWords + Math.floor(Math.random() * (maxWords - minWords));
  const words = Array.from({ length: n }, () => pick(WORDS));
  return words.join("​") + "។"; // joined with ZWSP like real Khmer prose, terminated with khan (។)
}

function paragraph(sentences = 4) {
  return Array.from({ length: sentences }, () => sentence()).join(" ");
}

type Unit = "sentences" | "paragraphs";

export default function KhmerLoremIpsum() {
  const [unit, setUnit] = useToolState<Unit>("khmer-lorem-ipsum:unit", "paragraphs");
  const [count, setCount] = useToolState("khmer-lorem-ipsum:count", 3);
  const [seedTick, setSeedTick] = useState(0);

  const output = useMemo(() => {
    if (unit === "sentences") {
      return Array.from({ length: count }, () => sentence()).join(" ");
    }
    return Array.from({ length: count }, () => paragraph()).join("\n\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, count, seedTick]);

  return (
    <ToolShell
      title="Khmer Placeholder Text Generator"
      khmerTitle="អត្ថបទបំពេញ"
      description="Lorem-ipsum-style filler text, but built from real everyday Khmer vocabulary so it fills mockups and layout tests without the odd look of Latin placeholder text next to Khmer UI."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Unit">
          <Select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
          </Select>
        </Field>
        <Field label="Count">
          <Select value={String(count)} onChange={(e) => setCount(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </Field>
      </div>
      <button
        type="button"
        onClick={() => setSeedTick((v) => v + 1)}
        className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)] hover:text-[var(--ink)]"
      >
        Regenerate
      </button>
      <Output label="Generated text" value={output} mono={false} />
    </ToolShell>
  );
}
