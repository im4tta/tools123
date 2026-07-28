"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function CssClampCalculator() {
  const [minPx, setMinPx] = useToolState("css-clamp-calculator:minPx", "16");
  const [maxPx, setMaxPx] = useToolState("css-clamp-calculator:maxPx", "32");
  const [minVw, setMinVw] = useToolState("css-clamp-calculator:minVw", "360");
  const [maxVw, setMaxVw] = useToolState("css-clamp-calculator:maxVw", "1440");

  const a = Number(minPx), b = Number(maxPx), vMin = Number(minVw), vMax = Number(maxVw);
  const valid = [a, b, vMin, vMax].every((n) => !isNaN(n)) && vMax > vMin;

  function clamp() {
    const slope = (b - a) / (vMax - vMin);
    const intersection = (-vMin * slope + a).toFixed(4);
    const slopeVw = (slope * 100).toFixed(4);
    return `clamp(${a}px, ${intersection}px + ${slopeVw}vw, ${b}px)`;
  }

  return (
    <ToolShell title="CSS clamp() Calculator" description="Generate a fluid font-size using clamp() that scales linearly between two viewport widths.">
      <Row>
        <Field label="Min size (px)"><TextInput value={minPx} onChange={(e) => setMinPx(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Max size (px)"><TextInput value={maxPx} onChange={(e) => setMaxPx(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Row>
        <Field label="Min viewport (px)"><TextInput value={minVw} onChange={(e) => setMinVw(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Max viewport (px)"><TextInput value={maxVw} onChange={(e) => setMaxVw(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="CSS" value={valid ? `font-size: ${clamp()};` : ""} error={!valid} />
    </ToolShell>
  );
}
