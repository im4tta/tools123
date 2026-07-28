"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextArea, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";

type Mode = "escape" | "unescape";

export default function StringEscapeTool() {
  const [input, setInput] = useState('Line one\n"quoted" & tab\tend');
  const [mode, setMode] = useState<Mode>("escape");

  const result = useMemo(() => {
    try {
      if (mode === "escape") {
        return JSON.stringify(input).slice(1, -1);
      }
      return JSON.parse(`"${input.replace(/(?<!\\)"/g, '\\"')}"`);
    } catch {
      return "";
    }
  }, [input, mode]);

  const error = mode === "unescape" && input !== "" && result === "";

  return (
    <ToolShell
      title="String Escape / Unescape"
      description="Convert text to and from a JS/JSON string literal — escaping newlines, tabs, quotes, and backslashes."
    >
      <Field label="Mode">
        <Select value={mode} onChange={(e) => setMode(e.target.value as Mode)} className="w-48">
          <option value="escape">Escape (raw → literal)</option>
          <option value="unescape">Unescape (literal → raw)</option>
        </Select>
      </Field>
      <Field label="Input">
        <TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <Output label="Result" value={String(result)} error={error} />
    </ToolShell>
  );
}
