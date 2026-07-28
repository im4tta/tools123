"use client";
import { useMemo } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const CODES: Record<number, string> = {
  200: "OK", 201: "Created", 202: "Accepted", 204: "No Content",
  301: "Moved Permanently", 302: "Found", 304: "Not Modified", 307: "Temporary Redirect", 308: "Permanent Redirect",
  400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 405: "Method Not Allowed",
  409: "Conflict", 410: "Gone", 422: "Unprocessable Entity", 429: "Too Many Requests",
  500: "Internal Server Error", 501: "Not Implemented", 502: "Bad Gateway", 503: "Service Unavailable", 504: "Gateway Timeout",
};

export default function HttpStatusLookup() {
  const [query, setQuery] = useToolState("http-status-lookup:query", "404");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(CODES).filter(([code, text]) => code.includes(q) || text.toLowerCase().includes(q));
  }, [query]);

  return (
    <ToolShell title="HTTP Status Code Reference" description="Search HTTP status codes by number or name.">
      <Field label="Search"><TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. 404 or not found" /></Field>
      <div className="divide-y divide-[var(--ground-line)] rounded-md border border-[var(--ground-line)]">
        {results.map(([code, text]) => (
          <div key={code} className="flex items-center gap-3 px-3 py-2 text-sm">
            <span className="w-12 font-mono-ui text-[var(--gold)]">{code}</span>
            <span className="text-[var(--ink)]">{text}</span>
          </div>
        ))}
        {results.length === 0 && <div className="px-3 py-4 text-center text-sm text-[var(--ink-faint)]">No match</div>}
      </div>
    </ToolShell>
  );
}
