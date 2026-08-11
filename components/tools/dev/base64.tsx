"use client";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function Base64Tool() {
  const [input, setInput] = useToolState("base64:input", "");
  const [output, setOutput] = useToolState("base64:output", "");
  const [error, setError] = useToolState("base64:error", false);
  const [mode, setMode] = useToolState<"encode" | "decode">("base64:mode", "encode");

  function run(next: "encode" | "decode", value: string) {
    try {
      if (next === "encode") {
        setOutput(btoa(unescape(encodeURIComponent(value))));
      } else {
        setOutput(decodeURIComponent(escape(atob(value))));
      }
      setError(false);
    } catch {
      setOutput("Could not decode — input is not valid Base64.");
      setError(true);
    }
  }

  return (
    <ToolShell title="Base64 Encode / Decode" description="Convert text to Base64 or decode a Base64 string back to text, fully client-side.">
      <div className="flex gap-2">
        {(["encode", "decode"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); run(m, input); }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wide ${mode === m ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}
          >
            {m}
          </button>
        ))}
      </div>
      <Field label={mode === "encode" ? "Plain text" : "Base64 string"}>
        <TextArea rows={6} value={input} onChange={(e) => { setInput(e.target.value); run(mode, e.target.value); }} />
      </Field>
      <Output label="Result" value={output} error={error} />
    </ToolShell>
  );
}
