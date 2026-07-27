"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Row, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

function diffLines(a: string[], b: string[]) {
  const max = Math.max(a.length, b.length);
  const rows: { a?: string; b?: string; status: "same" | "changed" | "added" | "removed" }[] = [];
  for (let i = 0; i < max; i++) {
    const av = a[i];
    const bv = b[i];
    if (av === bv) rows.push({ a: av, b: bv, status: "same" });
    else if (av === undefined) rows.push({ b: bv, status: "added" });
    else if (bv === undefined) rows.push({ a: av, status: "removed" });
    else rows.push({ a: av, b: bv, status: "changed" });
  }
  return rows;
}

export default function DiffChecker() {
  const [a, setA] = useToolState("diff-checker:a", "branch KS01\nbranch KS02\nbranch KS03");
  const [b, setB] = useToolState("diff-checker:b", "branch KS01\nbranch KS02-rev\nbranch KS03\nbranch KS04");
  const rows = useMemo(() => diffLines(a.split("\n"), b.split("\n")), [a, b]);
  const changedCount = rows.filter((r) => r.status !== "same").length;

  return (
    <ToolShell title="Text Diff Checker" description="Compare two blocks of text line by line and see what changed, was added, or removed.">
      <Row>
        <Field label="Original"><TextArea rows={8} value={a} onChange={(e) => setA(e.target.value)} /></Field>
        <Field label="Modified"><TextArea rows={8} value={b} onChange={(e) => setB(e.target.value)} /></Field>
      </Row>
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 font-mono-ui text-xs">
        <div className="mb-2 text-[var(--ink-dim)]">{changedCount} line(s) differ</div>
        {rows.map((r, i) => (
          <div key={i} className={
            r.status === "same" ? "text-[var(--ink-dim)]" :
            r.status === "added" ? "text-[var(--teal)]" :
            r.status === "removed" ? "text-[var(--danger)]" : "text-[var(--gold)]"
          }>
            {r.status === "added" && `+ ${r.b}`}
            {r.status === "removed" && `- ${r.a}`}
            {r.status === "changed" && `~ ${r.a}  →  ${r.b}`}
            {r.status === "same" && `  ${r.a}`}
          </div>
        ))}
      </div>
    </ToolShell>
  );
}
