"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const TABLE: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];
const REVERSE: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

function toRoman(n: number) {
  let num = n, out = "";
  for (const [v, s] of TABLE) { while (num >= v) { out += s; num -= v; } }
  return out;
}
function fromRoman(s: string) {
  let total = 0;
  const up = s.toUpperCase();
  for (let i = 0; i < up.length; i++) {
    const cur = REVERSE[up[i]], next = REVERSE[up[i + 1]];
    if (!cur) return null;
    total += next && cur < next ? -cur : cur;
  }
  return total;
}

export default function RomanNumeral() {
  const [num, setNum] = useToolState("roman-numeral:num", "123");
  const [roman, setRoman] = useToolState("roman-numeral:roman", "CXXIII");

  function onNumChange(v: string) {
    setNum(v);
    const n = Math.trunc(Number(v));
    if (!isNaN(n) && n > 0 && n < 4000) setRoman(toRoman(n));
  }
  function onRomanChange(v: string) {
    setRoman(v);
    const n = fromRoman(v);
    if (n !== null && n > 0) setNum(String(n));
  }

  return (
    <ToolShell title="Roman Numeral Converter" description="Convert between Arabic numbers (1–3999) and Roman numerals.">
      <Row>
        <Field label="Number"><TextInput value={num} onChange={(e) => onNumChange(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Roman numeral"><TextInput value={roman} onChange={(e) => onRomanChange(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="Roman" value={roman} />
    </ToolShell>
  );
}
