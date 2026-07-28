"use client";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const WEIGHTS = [
  { w: 400, label: "Regular" },
  { w: 500, label: "Medium" },
  { w: 600, label: "Semibold" },
  { w: 700, label: "Bold" },
];
const SIZES = [16, 20, 28, 40];

export default function FontPreview() {
  const [text, setText] = useToolState("font-preview:text", "ភ្នំពេញ​រដ្ឋធានី​នៃ​ព្រះរាជាណាចក្រ​កម្ពុជា");

  return (
    <ToolShell title="Khmer Web Font Preview" khmerTitle="គំរូអក្សរ" description="Preview a string of Khmer text across weights and sizes using Noto Sans Khmer, useful for checking glyph stacking before shipping UI copy.">
      <Field label="Text"><TextArea rows={2} value={text} onChange={(e) => setText(e.target.value)} className="font-khmer" /></Field>
      <div className="space-y-4 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
        {WEIGHTS.map(({ w, label }) => (
          <div key={w} className="border-b border-[var(--ground-line)] pb-3 last:border-0">
            <div className="mb-1 text-xs uppercase tracking-wide text-[var(--ink-dim)]">{label} · {w}</div>
            {SIZES.map((s) => (
              <div key={s} className="font-khmer" style={{ fontWeight: w, fontSize: s }}>{text || "​"}</div>
            ))}
          </div>
        ))}
      </div>
    </ToolShell>
  );
}
