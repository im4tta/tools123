"use client";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function UrlEncodeTool() {
  const [input, setInput] = useToolState("url-encode:input", "https://tmeta.me/search?q=សួស្តី ភ្នំពេញ");
  const [mode, setMode] = useToolState<"encode" | "decode">("url-encode:mode", "encode");

  let output = "";
  let error = false;
  try {
    output = mode === "encode" ? encodeURIComponent(input) : decodeURIComponent(input);
  } catch {
    output = "Malformed sequence — cannot decode.";
    error = true;
  }

  return (
    <ToolShell title="URL Encode / Decode" description="Percent-encode text for safe use in URLs, or decode a percent-encoded string.">
      <div className="flex gap-2">
        {(["encode", "decode"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wide ${mode === m ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}
          >
            {m}
          </button>
        ))}
      </div>
      <Field label="Input">
        <TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <Output label="Result" value={output} error={error} />
    </ToolShell>
  );
}
