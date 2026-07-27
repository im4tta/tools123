"use client";
import { ToolShell, TextArea, TextInput, Field, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function FindReplace() {
  const [input, setInput] = useToolState("find-replace:input", "The quick brown fox jumps over the lazy fox.");
  const [find, setFind] = useToolState("find-replace:find", "fox");
  const [replace, setReplace] = useToolState("find-replace:replace", "dog");
  const [useRegex, setUseRegex] = useToolState("find-replace:useRegex", false);
  const [error, setError] = useToolState("find-replace:error", "");

  function result() {
    if (!find) return input;
    try {
      setError("");
      const pattern = useRegex ? new RegExp(find, "g") : new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      return input.replace(pattern, replace);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid pattern");
      return input;
    }
  }

  const output = result();

  return (
    <ToolShell title="Find & Replace" description="Replace all matches of plain text or a regular expression.">
      <Field label="Text"><TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      <Row>
        <Field label="Find"><TextInput value={find} onChange={(e) => setFind(e.target.value)} className="font-mono-ui" /></Field>
        <Field label="Replace with"><TextInput value={replace} onChange={(e) => setReplace(e.target.value)} className="font-mono-ui" /></Field>
      </Row>
      <label className="flex items-center gap-2 text-xs text-[var(--ink-dim)]">
        <input type="checkbox" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} />
        Treat &quot;Find&quot; as a regular expression
      </label>
      <Output label="Result" value={error || output} error={!!error} />
    </ToolShell>
  );
}
