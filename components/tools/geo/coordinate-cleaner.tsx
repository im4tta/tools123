"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function parseMessy(line: string): [number, number] | null {
  const cleaned = line.replace(/[°NnEeSsWw]/g, "").trim();
  const m = cleaned.split(/[,;\s]+/).filter(Boolean);
  if (m.length < 2) return null;
  const lat = Number(m[0]), lng = Number(m[1]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return [lat, lng];
}

export default function CoordinateCleaner() {
  const [input, setInput] = useToolState("coordinate-cleaner:input", "11.5564N, 104.9282E\n11.0686 104.9531\nlat: 10.6104 lng: 104.1817");

  const rows = useMemo(
    () => input.split("\n").filter(Boolean).map((line) => ({ line, parsed: parseMessy(line) })),
    [input]
  );

  return (
    <ToolShell title="Coordinate Format Cleaner" description="Paste messy coordinate strings from spreadsheets, field notes, or old KMLs and get clean 'lat,lng' pairs.">
      <Field label="Messy input (one per line)"><TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
      <Output
        label="Cleaned"
        value={rows.map((r) => (r.parsed ? `${r.parsed[0]},${r.parsed[1]}` : `⚠ could not parse: ${r.line}`)).join("\n")}
      />
    </ToolShell>
  );
}
