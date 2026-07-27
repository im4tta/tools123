"use client";
import { ToolShell, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function luminance(hex: string) {
  const m = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(m.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export default function ContrastChecker() {
  const [fg, setFg] = useToolState("contrast-checker:fg", "#edeae2");
  const [bg, setBg] = useToolState("contrast-checker:bg", "#0a0c0d");
  const valid = /^#[0-9a-fA-F]{6}$/.test(fg) && /^#[0-9a-fA-F]{6}$/.test(bg);
  const ratio = valid ? (() => {
    const l1 = luminance(fg) + 0.05, l2 = luminance(bg) + 0.05;
    return l1 > l2 ? l1 / l2 : l2 / l1;
  })() : 0;

  return (
    <ToolShell title="WCAG Contrast Checker" description="Computes the contrast ratio between two colors and checks against WCAG AA/AAA thresholds.">
      <Row>
        <Field label="Foreground"><TextInput value={fg} onChange={(e) => setFg(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Background"><TextInput value={bg} onChange={(e) => setBg(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      {valid && (
        <div className="rounded-md border border-[var(--ground-line)] p-4 text-center" style={{ background: bg, color: fg }}>
          The quick brown fox jumps over the lazy dog
        </div>
      )}
      <Output label="Contrast ratio" value={valid ? `${ratio.toFixed(2)} : 1` : ""} error={!valid} />
      {valid && (
        <div className="flex gap-3 text-xs">
          <span className={ratio >= 4.5 ? "text-[var(--success)]" : "text-[var(--danger)]"}>AA normal text {ratio >= 4.5 ? "✓" : "✗"}</span>
          <span className={ratio >= 3 ? "text-[var(--success)]" : "text-[var(--danger)]"}>AA large text {ratio >= 3 ? "✓" : "✗"}</span>
          <span className={ratio >= 7 ? "text-[var(--success)]" : "text-[var(--danger)]"}>AAA normal text {ratio >= 7 ? "✓" : "✗"}</span>
        </div>
      )}
    </ToolShell>
  );
}
