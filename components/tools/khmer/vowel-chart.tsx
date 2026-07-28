"use client";
import { ToolShell } from "@/components/ui/Shell";

const VOWELS: { sign: string; s1: string; s2: string }[] = [
  { sign: "◌ា", s1: "a", s2: "ie·a" },
  { sign: "◌ិ", s1: "e", s2: "i" },
  { sign: "◌ី", s1: "ei", s2: "i" },
  { sign: "◌ឹ", s1: "eu", s2: "oe" },
  { sign: "◌ឺ", s1: "eu", s2: "oe" },
  { sign: "◌ុ", s1: "o", s2: "u" },
  { sign: "◌ូ", s1: "o", s2: "u" },
  { sign: "◌ើ", s1: "aeu", s2: "eu" },
  { sign: "◌ែ", s1: "ae", s2: "e" },
  { sign: "◌ៃ", s1: "ai", s2: "ei" },
  { sign: "◌ោ", s1: "ao", s2: "oo" },
  { sign: "◌ៅ", s1: "au", s2: "ou" },
];

export default function VowelChart() {
  return (
    <ToolShell title="Dependent Vowel Reference" khmerTitle="ស្រៈនិស្ស័យ" description="Dependent vowel signs are pronounced differently depending on whether the base consonant is 1st series or 2nd series. Quick reference table.">
      <div className="overflow-hidden rounded-md border border-[var(--ground-line)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--ground-raised)] text-xs uppercase tracking-wide text-[var(--ink-dim)]">
            <tr>
              <th className="px-3 py-2 text-left">Sign</th>
              <th className="px-3 py-2 text-left">1st series</th>
              <th className="px-3 py-2 text-left">2nd series</th>
            </tr>
          </thead>
          <tbody>
            {VOWELS.map((v) => (
              <tr key={v.sign} className="border-t border-[var(--ground-line)]">
                <td className="px-3 py-2 font-khmer text-xl">{v.sign}</td>
                <td className="px-3 py-2 font-mono-ui text-[var(--slate-accent)]">{v.s1}</td>
                <td className="px-3 py-2 font-mono-ui text-[var(--teal)]">{v.s2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ToolShell>
  );
}
