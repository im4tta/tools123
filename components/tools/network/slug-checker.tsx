"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function SlugChecker() {
  const [input, setInput] = useToolState("slug-checker:input", "my-blog-post-2026");

  const checks = useMemo(() => {
    const lower = input === input.toLowerCase();
    const validChars = /^[a-z0-9-]*$/.test(input);
    const noDoubleHyphen = !input.includes("--");
    const noEdgeHyphen = !input.startsWith("-") && !input.endsWith("-");
    const notEmpty = input.length > 0;
    return { lower, validChars, noDoubleHyphen, noEdgeHyphen, notEmpty };
  }, [input]);

  const allPass = Object.values(checks).every(Boolean);

  return (
    <ToolShell title="Domain / Slug Validity Checker" description="Checks whether a string is a well-formed URL slug.">
      <Field label="Slug"><TextInput value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
      <div className="space-y-1.5 text-sm">
        {[
          ["Lowercase only", checks.lower],
          ["Only letters, digits, hyphens", checks.validChars],
          ["No double hyphens", checks.noDoubleHyphen],
          ["No leading/trailing hyphen", checks.noEdgeHyphen],
          ["Not empty", checks.notEmpty],
        ].map(([label, pass]) => (
          <div key={label as string} className="flex items-center gap-2">
            <span className={pass ? "text-[var(--success)]" : "text-[var(--danger)]"}>{pass ? "✓" : "✗"}</span>
            <span className="text-[var(--ink-dim)]">{label}</span>
          </div>
        ))}
      </div>
      <Output label="Verdict" value={allPass ? "Valid slug" : "Not a valid slug"} error={!allPass} />
    </ToolShell>
  );
}
