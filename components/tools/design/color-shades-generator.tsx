"use client";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

function mix(hex: string, target: string, amount: number) {
  const h = hex.replace("#", ""), t = target.replace("#", "");
  const parts = [0, 2, 4].map((i) => {
    const a = parseInt(h.slice(i, i + 2), 16), b = parseInt(t.slice(i, i + 2), 16);
    return Math.round(a + (b - a) * amount).toString(16).padStart(2, "0");
  });
  return `#${parts.join("")}`;
}

export default function ColorShadesGenerator() {
  const [base, setBase] = useToolState("color-shades-generator:base", "#c9a24b");
  const valid = /^#[0-9a-fA-F]{6}$/.test(base);
  const tints = [0.85, 0.65, 0.45, 0.25].map((a) => mix(base, "#ffffff", a)).reverse();
  const shades = [0.2, 0.4, 0.6, 0.8].map((a) => mix(base, "#000000", a));

  return (
    <ToolShell title="Tints & Shades Generator" description="Mixes a base color toward white (tints) and black (shades).">
      <Field label="Base color"><TextInput value={base} onChange={(e) => setBase(e.target.value)} className="font-mono-ui" /></Field>
      {valid ? (
        <div className="grid grid-cols-9 gap-1.5">
          {[...tints, base, ...shades].map((c, i) => (
            <div key={i} className="overflow-hidden rounded border border-[var(--ground-line)]">
              <div className="h-14" style={{ background: c }} />
              <div className="px-1 py-1 text-center font-mono-ui text-[10px] text-[var(--ink-faint)]">{c}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--danger)]">Enter a valid 6-digit hex color</p>
      )}
    </ToolShell>
  );
}
