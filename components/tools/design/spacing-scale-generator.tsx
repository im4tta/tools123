"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function SpacingScaleGenerator() {
  const [base, setBase] = useToolState("spacing-scale-generator:base", "4");
  const [ratio, setRatio] = useToolState("spacing-scale-generator:ratio", "1.5");
  const [steps, setSteps] = useToolState("spacing-scale-generator:steps", "8");
  const b = Number(base), r = Number(ratio), n = Math.max(1, Math.min(20, Number(steps) || 8));
  const valid = !isNaN(b) && !isNaN(r) && b > 0 && r > 1;

  function scale() {
    const values: number[] = [];
    for (let i = 0; i < n; i++) values.push(Math.round(b * Math.pow(r, i)));
    return values;
  }

  return (
    <ToolShell title="Spacing Scale Generator" description="Generate a geometric spacing scale for consistent margins and padding.">
      <Row>
        <Field label="Base (px)"><TextInput value={base} onChange={(e) => setBase(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Ratio"><TextInput value={ratio} onChange={(e) => setRatio(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Steps"><TextInput value={steps} onChange={(e) => setSteps(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      {valid && (
        <div className="space-y-1.5">
          {scale().map((v, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="w-16 font-mono-ui text-[var(--ink-faint)]">step {i}</span>
              <div className="h-3 rounded bg-[var(--gold)]" style={{ width: `${v}px`, maxWidth: "100%" }} />
              <span className="font-mono-ui text-[var(--ink-dim)]">{v}px</span>
            </div>
          ))}
        </div>
      )}
      <Output label="CSS custom properties" value={valid ? scale().map((v, i) => `--space-${i}: ${v}px;`).join("\n") : ""} error={!valid} />
    </ToolShell>
  );
}
