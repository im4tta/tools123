"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function parseCsv(csv: string) {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
  });
}

export default function CsvJson() {
  const [csv, setCsv] = useToolState("csv-json:csv", "name,type,length_m\nKS01,primary,4200\nKS02,secondary,1800");
  const { json, error } = useMemo(() => {
    try {
      return { json: JSON.stringify(parseCsv(csv), null, 2), error: false };
    } catch (e) {
      return { json: e instanceof Error ? e.message : "Parse error", error: true };
    }
  }, [csv]);

  return (
    <ToolShell title="CSV → JSON" description="Paste comma-separated values with a header row and get an array of JSON objects.">
      <Field label="CSV"><TextArea rows={7} value={csv} onChange={(e) => setCsv(e.target.value)} /></Field>
      <Output label="JSON" value={json} error={error} />
    </ToolShell>
  );
}
