"use client";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function UrlParser() {
  const [input, setInput] = useToolState("url-parser:input", "https://example.com:8080/path/to/page?query=one&name=Dara#section");
  let url: URL | null = null;
  try { url = new URL(input); } catch { url = null; }

  return (
    <ToolShell title="URL Parser & Query String Inspector" description="Breaks a URL into its components and lists query parameters.">
      <Field label="URL"><TextInput value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
      {url ? (
        <>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Protocol", url.protocol], ["Host", url.hostname], ["Port", url.port || "(default)"],
              ["Path", url.pathname], ["Hash", url.hash || "(none)"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2">
                <div className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
                <div className="mt-1 font-mono-ui text-[var(--ink)]">{value}</div>
              </div>
            ))}
          </div>
          <Output label="Query parameters" value={[...url.searchParams.entries()].map(([k, v]) => `${k} = ${v}`).join("\n") || "(none)"} />
        </>
      ) : (
        <Output label="Result" value="Not a valid absolute URL" error />
      )}
    </ToolShell>
  );
}
