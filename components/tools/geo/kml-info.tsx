"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

export default function KmlInfo() {
  const [xml, setXml] = useToolState("kml-info:xml", `<?xml version="1.0"?>\n<kml><Document>\n  <Placemark><name>KS07</name><Point><coordinates>104.9282,11.5564,0</coordinates></Point></Placemark>\n  <Placemark><name>KS08</name><Point><coordinates>104.9310,11.5590,0</coordinates></Point></Placemark>\n</Document></kml>`);

  const { placemarks, error } = useMemo(() => {
    try {
      const doc = new DOMParser().parseFromString(xml, "application/xml");
      if (doc.querySelector("parsererror")) return { placemarks: [], error: "Malformed XML" };
      const marks = [...doc.getElementsByTagName("Placemark")].map((pm) => {
        const name = pm.getElementsByTagName("name")[0]?.textContent ?? "(unnamed)";
        const coords = pm.getElementsByTagName("coordinates")[0]?.textContent?.trim() ?? "";
        return { name, coords };
      });
      return { placemarks: marks, error: marks.length ? "" : "No <Placemark> elements found" };
    } catch {
      return { placemarks: [], error: "Could not parse" };
    }
  }, [xml]);

  return (
    <ToolShell title="KML Placemark Inspector" description="Paste raw KML and list every Placemark's name and coordinates — a quick way to sanity-check exports before converting to GeoJSON.">
      <Field label="KML"><TextArea rows={8} value={xml} onChange={(e) => setXml(e.target.value)} className="font-mono-ui" /></Field>
      <Output
        label={error || `${placemarks.length} placemark(s)`}
        value={placemarks.map((p) => `${p.name}\t${p.coords}`).join("\n")}
        error={!!error}
      />
    </ToolShell>
  );
}
