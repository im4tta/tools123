"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function GeojsonFormatter() {
  const [input, setInput] = useToolState("geojson-formatter:input", '{"type":"Feature","properties":{"name":"KS07"},"geometry":{"type":"Point","coordinates":[104.9282,11.5564]}}');

  const { output, error, summary } = useMemo(() => {
    try {
      const obj = JSON.parse(input);
      let summary = "";
      if (obj.type === "FeatureCollection") summary = `FeatureCollection · ${obj.features?.length ?? 0} feature(s)`;
      else if (obj.type === "Feature") summary = `Feature · geometry: ${obj.geometry?.type ?? "none"}`;
      else if (obj.type) summary = `Geometry · ${obj.type}`;
      return { output: JSON.stringify(obj, null, 2), error: false, summary };
    } catch (e) {
      return { output: e instanceof Error ? e.message : "Invalid JSON", error: true, summary: "" };
    }
  }, [input]);

  return (
    <ToolShell title="GeoJSON Formatter & Validator" description="Validate and pretty-print a GeoJSON Feature, FeatureCollection, or bare geometry, with a quick structural summary.">
      <Field label="GeoJSON"><TextArea rows={8} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
      {summary && <Output label="Summary" value={summary} mono={false} />}
      <Output label={error ? "Parse error" : "Formatted"} value={output} error={error} />
    </ToolShell>
  );
}
