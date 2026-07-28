"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const MIME: [string, string][] = [
  [".html", "text/html"], [".css", "text/css"], [".js", "text/javascript"], [".json", "application/json"],
  [".png", "image/png"], [".jpg / .jpeg", "image/jpeg"], [".gif", "image/gif"], [".svg", "image/svg+xml"],
  [".webp", "image/webp"], [".pdf", "application/pdf"], [".zip", "application/zip"],
  [".mp3", "audio/mpeg"], [".mp4", "video/mp4"], [".csv", "text/csv"], [".xml", "application/xml"],
  [".txt", "text/plain"], [".woff2", "font/woff2"], [".doc", "application/msword"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
];

export default function MimeTypeLookup() {
  const [query, setQuery] = useToolState("mime-type-lookup:query", "json");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\./, "");
    return MIME.filter(([ext, type]) => ext.toLowerCase().includes(q) || type.toLowerCase().includes(q));
  }, [query]);

  return (
    <ToolShell title="MIME Type Lookup" description="Search common file extensions and their MIME types.">
      <Field label="Search"><TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. png or application/json" /></Field>
      <div className="divide-y divide-[var(--ground-line)] rounded-md border border-[var(--ground-line)]">
        {results.map(([ext, type]) => (
          <div key={ext} className="flex items-center justify-between px-3 py-2 text-sm">
            <span className="font-mono-ui text-[var(--gold)]">{ext}</span>
            <span className="font-mono-ui text-[var(--ink-dim)]">{type}</span>
          </div>
        ))}
        {results.length === 0 && <div className="px-3 py-4 text-center text-sm text-[var(--ink-faint)]">No match</div>}
      </div>
    </ToolShell>
  );
}
