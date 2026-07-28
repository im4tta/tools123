"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

type SortDir = "asc" | "desc";

export default function CollationSorter() {
  const [input, setInput] = useToolState(
    "collation-sorter:input",
    "សៀមរាប\nកណ្ដាល\nស្ទឹងត្រែង\nឧត្តរមានជ័យ\nកំពង់ចាម\nក្រចេះ"
  );
  const [dir, setDir] = useToolState<SortDir>("collation-sorter:dir", "asc");

  const { naive, collated, differ } = useMemo(() => {
    const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
    const naiveSorted = [...lines].sort();

    // Plain JS .sort() compares strings by UTF-16 code unit, which happens to
    // line up with Khmer's intended alphabetical order for base consonants
    // (the block was designed in traditional dictionary order) but breaks
    // down as soon as combining vowels, subscripts (coeng), or independent
    // vowels mix in — Intl.Collator("km") applies the actual Unicode
    // collation algorithm tailored for Khmer instead of raw codepoint order.
    let collator: Intl.Collator | null = null;
    try {
      collator = new Intl.Collator("km", { sensitivity: "base" });
    } catch {
      collator = null;
    }
    const collatedSorted = collator
      ? [...lines].sort((a, b) => collator!.compare(a, b))
      : naiveSorted;

    if (dir === "desc") {
      naiveSorted.reverse();
      collatedSorted.reverse();
    }

    let differAt = -1;
    for (let i = 0; i < Math.min(naiveSorted.length, collatedSorted.length); i++) {
      if (naiveSorted[i] !== collatedSorted[i]) {
        differAt = i;
        break;
      }
    }

    return { naive: naiveSorted, collated: collatedSorted, differ: differAt };
  }, [input, dir]);

  return (
    <ToolShell
      title="Khmer Collation Sorter"
      khmerTitle="តម្រៀបតាមអក្ខរក្រម"
      description="Sorts a list of Khmer words two ways — a plain JS .sort() (raw UTF-16 order) and Intl.Collator('km') (locale-aware order) — side by side, so you can see whether the difference actually matters for your data before shipping a sorted list."
    >
      <Field label="One item per line" hint={`${input.split("\n").filter((l) => l.trim()).length} items`}>
        <TextArea rows={7} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer" />
      </Field>
      <Field label="Direction">
        <Select value={dir} onChange={(e) => setDir(e.target.value as SortDir)}>
          <option value="asc">A → Z</option>
          <option value="desc">Z → A</option>
        </Select>
      </Field>
      <Output
        label={differ === -1 ? "Intl.Collator('km') order — identical to plain sort here" : "Intl.Collator('km') order — differs from plain sort"}
        error={differ !== -1}
        value={collated.join("\n")}
      />
      <Output label="Plain .sort() order (for comparison)" value={naive.join("\n")} />
    </ToolShell>
  );
}
