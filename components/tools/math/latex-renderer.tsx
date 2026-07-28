"use client";
import { useEffect, useState } from "react";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const SAMPLES: Record<string, string> = {
  Quadratic: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
  "Euler's identity": "e^{i\\pi} + 1 = 0",
  "Sum": "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}",
  Matrix: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}",
};

export default function LatexRenderer() {
  const [tex, setTex] = useToolState("latex-renderer:tex", SAMPLES["Quadratic"]);
  const [display, setDisplay] = useToolState<"inline" | "block">("latex-renderer:display", "block");
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    import("katex").then((katex) => {
      if (cancelled) return;
      try {
        setHtml(katex.default.renderToString(tex, { displayMode: display === "block", throwOnError: true, output: "html" }));
        setError("");
      } catch (e) {
        setHtml("");
        setError(e instanceof Error ? e.message : "Could not parse that expression.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tex, display]);

  return (
    <ToolShell
      title="LaTeX Formula Renderer"
      description="Type LaTeX math and see it typeset live using KaTeX — no server round-trip, useful for previewing formulas before dropping them into a paper, README, or note."
    >
      <Field label="LaTeX" hint="Standard LaTeX math syntax">
        <TextArea rows={4} value={tex} onChange={(e) => setTex(e.target.value)} className="font-mono-ui" placeholder="e = mc^2" />
      </Field>
      <Field label="Display mode">
        <Select value={display} onChange={(e) => setDisplay(e.target.value as "inline" | "block")}>
          <option value="block">Block (centered, larger)</option>
          <option value="inline">Inline</option>
        </Select>
      </Field>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(SAMPLES).map(([label, value]) => (
          <button
            key={label}
            type="button"
            onClick={() => setTex(value)}
            className="rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1 text-xs text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)]"
          >
            {label}
          </button>
        ))}
      </div>
      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Rendered</div>
        <div className="min-h-[4rem] overflow-x-auto rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-[var(--ink)]">
          {error ? (
            <span className="text-sm text-[var(--danger)]">{error}</span>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </div>
    </ToolShell>
  );
}
