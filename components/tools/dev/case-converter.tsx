"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function words(s: string) {
  return s.replace(/([a-z])([A-Z])/g, "$1 $2").split(/[\s_\-]+/).filter(Boolean).map((w) => w.toLowerCase());
}

export default function CaseConverter() {
  const [input, setInput] = useToolState("case-converter:input", "Kandal Stung Canal Network");
  const w = useMemo(() => words(input), [input]);
  const forms = {
    camelCase: w.map((word, i) => (i === 0 ? word : word[0].toUpperCase() + word.slice(1))).join(""),
    PascalCase: w.map((word) => word[0]?.toUpperCase() + word.slice(1)).join(""),
    snake_case: w.join("_"),
    "kebab-case": w.join("-"),
    "CONSTANT_CASE": w.join("_").toUpperCase(),
    "Title Case": w.map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" "),
  };

  return (
    <ToolShell title="Case Converter" description="Convert identifiers between camelCase, snake_case, kebab-case and more.">
      <Field label="Input"><TextArea rows={3} value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      {Object.entries(forms).map(([k, v]) => <Output key={k} label={k} value={v} />)}
    </ToolShell>
  );
}
