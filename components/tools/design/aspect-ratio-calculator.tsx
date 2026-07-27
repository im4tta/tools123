"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

export default function AspectRatioCalculator() {
  const [w, setW] = useToolState("aspect-ratio-calculator:w", "1920");
  const [h, setH] = useToolState("aspect-ratio-calculator:h", "1080");
  const [newW, setNewW] = useToolState("aspect-ratio-calculator:newW", "1280");
  const W = Number(w), H = Number(h), NW = Number(newW);
  const valid = !isNaN(W) && !isNaN(H) && W > 0 && H > 0;
  const g = valid ? gcd(W, H) : 1;
  const newH = valid && !isNaN(NW) ? (NW * H) / W : 0;

  return (
    <ToolShell title="Aspect Ratio Calculator" description="Simplify a width/height ratio and scale to a new width.">
      <Row>
        <Field label="Width"><TextInput value={w} onChange={(e) => setW(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Height"><TextInput value={h} onChange={(e) => setH(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <Output label="Ratio" value={valid ? `${W / g} : ${H / g}` : ""} error={!valid} />
      <Field label="Scale to new width"><TextInput value={newW} onChange={(e) => setNewW(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Resulting height" value={valid ? newH.toFixed(1) : ""} error={!valid} />
    </ToolShell>
  );
}
