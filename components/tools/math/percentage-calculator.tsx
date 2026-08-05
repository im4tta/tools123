"use client";
import { ToolShell, TextInput, Field, Row, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { ResultGraph } from "@/components/ui/ResultGraph";
import { useToolState } from "@/lib/storage";
import { useQueryInput } from "@/lib/query-input";
import { useEffect } from "react";

export default function PercentageCalculator() {
  const [mode, setMode] = useToolState<"of" | "isWhat" | "change">("percentage-calculator:mode", "of");
  const [a, setA] = useToolState("percentage-calculator:a", "15");
  const [b, setB] = useToolState("percentage-calculator:b", "200");
  const queryInput = useQueryInput();

  useEffect(() => {
    const match = queryInput.match(/^\s*([\d,.]+)%\s*(?:of|នៃ)\s*([\d,.]+)\s*$/i);
    if (!match) return;
    setMode("of");
    setA(match[1].replace(/,/g, ""));
    setB(match[2].replace(/,/g, ""));
  }, [queryInput, setA, setB, setMode]);

  const x = Number(a), y = Number(b);
  const valid = Number.isFinite(x) && Number.isFinite(y) && ((mode !== "isWhat" && mode !== "change") || (mode === "isWhat" ? y !== 0 : x !== 0));
  const format = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  const gcd = (left: number, right: number): number => right ? gcd(right, left % right) : Math.abs(left);
  const calculated = mode === "of" ? (x / 100) * y : mode === "isWhat" ? (x / y) * 100 : ((y - x) / x) * 100;
  const primaryValue = valid ? (mode === "of" ? format(calculated) : `${format(calculated)}%`) : "";
  const related = valid && mode === "of"
    ? (() => {
        const denominator = 100 / gcd(x, 100);
        const numerator = x / gcd(x, 100);
        return [
          { label: "Decimal", value: format(x / 100) },
          { label: "Fraction", value: `${numerator}/${denominator}` },
          { label: "Remaining", value: format(y - calculated) },
        ];
      })()
    : valid && mode === "isWhat"
      ? [{ label: "Decimal ratio", value: format(x / y) }, { label: "Difference", value: format(x - y) }]
      : valid
        ? [{ label: "Absolute change", value: format(y - x) }, { label: "Multiplier", value: `${format(y / x)}×` }]
        : [];

  return (
    <ToolShell title="Percentage Calculator" description="Three common percentage questions in one tool.">
      <Field label="Mode">
        <Select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
          <option value="of">A% of B</option>
          <option value="isWhat">A is what % of B</option>
          <option value="change">% change from A to B</option>
        </Select>
      </Field>
      <Row>
        <Field label="A"><TextInput value={a} onChange={(e) => setA(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="B"><TextInput value={b} onChange={(e) => setB(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      {valid ? (
        <ResultGraph
          primary={{ label: mode === "of" ? "Result" : mode === "isWhat" ? "Percentage" : "Percent change", value: primaryValue }}
          related={related}
          formula={mode === "of" ? `${format(x)}% × ${format(y)}` : mode === "isWhat" ? `${format(x)} ÷ ${format(y)} × 100` : `(${format(y)} − ${format(x)}) ÷ ${format(x)} × 100`}
          explanation={mode === "of" ? `${format(x)} percent of ${format(y)} equals ${primaryValue}.` : mode === "isWhat" ? `${format(x)} is ${primaryValue} of ${format(y)}.` : `The change from ${format(x)} to ${format(y)} is ${primaryValue}.`}
          toolId="percentage-calculator"
          learning={{ example: "Try 15% of 200. The result is 30.", check: `Compare your answer with ${primaryValue}.` }}
        />
      ) : <Output label="Result" value="Enter valid numbers for the selected percentage mode." error />}
    </ToolShell>
  );
}
