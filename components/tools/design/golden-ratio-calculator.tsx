"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";

const PHI = 1.6180339887;

export default function GoldenRatioCalculatorTool() {
  const [known, setKnown] = useState(400);

  const { larger, smaller } = useMemo(
    () => ({
      larger: known * PHI,
      smaller: known / PHI,
    }),
    [known]
  );

  const round = (n: number) => Math.round(n * 100) / 100;

  return (
    <ToolShell
      title="Golden Ratio Calculator"
      description="Given one dimension, find the complementary side that keeps a golden ratio (≈1.618:1) proportion — handy for layouts, crops, and grids."
    >
      <Field label="Known dimension (px, mm, etc.)">
        <TextInput type="number" value={known} onChange={(e) => setKnown(Number(e.target.value))} className="w-48" />
      </Field>
      <Row>
        <Output label="If this is the shorter side → longer side" value={String(round(larger))} />
        <Output label="If this is the longer side → shorter side" value={String(round(smaller))} />
      </Row>
      <p className="text-xs text-[var(--ink-faint)]">φ (phi) = 1.6180339887…</p>
    </ToolShell>
  );
}
