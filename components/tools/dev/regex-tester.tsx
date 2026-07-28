"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function RegexTester() {
  const [pattern, setPattern] = useToolState("regex-tester:pattern", "\\b[A-Z]{2,}\\d+\\b");
  const [flags, setFlags] = useToolState("regex-tester:flags", "g");
  const [text, setText] = useToolState("regex-tester:text", "Contract ref CNO2024, canal branch KS07, structure ID STR118.");

  const { matches, error } = useMemo(() => {
    try {
      const re = new RegExp(pattern, flags);
      const found = [...text.matchAll(new RegExp(pattern, flags.includes("g") ? flags : flags + "g"))];
      return { matches: found.map((m) => `${m[0]}  @${m.index}`), error: false };
    } catch (e) {
      return { matches: [e instanceof Error ? e.message : "Invalid pattern"], error: true };
    }
  }, [pattern, flags, text]);

  return (
    <ToolShell title="Regex Tester" description="Test a JavaScript regular expression against sample text and see every match with its position.">
      <div className="flex gap-3">
        <Field label="Pattern">
          <TextInput value={pattern} onChange={(e) => setPattern(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label="Flags">
          <TextInput value={flags} onChange={(e) => setFlags(e.target.value)} className="w-24 font-mono-ui" />
        </Field>
      </div>
      <Field label="Test text">
        <TextArea rows={5} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <Output label={error ? "Error" : `Matches (${matches.length})`} value={matches.join("\n")} error={error} />
    </ToolShell>
  );
}
