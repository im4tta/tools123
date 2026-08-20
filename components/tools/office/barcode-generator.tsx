"use client";
import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { Download } from "lucide-react";
import { ToolShell, TextInput, Field, Select } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const TYPES: { id: string; label: string; hint: string }[] = [
  { id: "CODE128", label: "Code 128", hint: "Any ASCII text" },
  { id: "EAN13", label: "EAN-13", hint: "12 or 13 digits" },
  { id: "EAN8", label: "EAN-8", hint: "7 or 8 digits" },
  { id: "UPC", label: "UPC-A", hint: "11 or 12 digits" },
  { id: "CODE39", label: "Code 39", hint: "A–Z, 0–9, and a few symbols" },
];

export default function BarcodeGenerator() {
  const { text: t } = useLanguage();
  const [type, setType] = useToolState("barcode:type", "CODE128");
  const [value, setValue] = useToolState("barcode:value", "https://123tool.app");
  const [error, setError] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);

  const active = TYPES.find((x) => x.id === type) ?? TYPES[0];

  useEffect(() => {
    if (!svgRef.current) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: type,
        displayValue: true,
        margin: 10,
        height: 80,
        width: 2,
        background: "transparent",
        lineColor: "currentColor",
        font: "monospace",
        fontSize: 16,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("");
    } catch {
      setError(t("Invalid value for this barcode type.", "តម្លៃមិនត្រឹមត្រូវសម្រាប់ប្រភេទកូដនេះទេ។"));
      svgRef.current.innerHTML = "";
    }
  }, [type, value, t]);

  function download() {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([xml], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcode-${type}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolShell
      title="Barcode Generator"
      description="Generate Code 128, EAN-13, EAN-8, UPC-A, and Code 39 barcodes as SVG — rendered locally."
    >
      <div className="space-y-4">
        <Field label="Barcode type">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((b) => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Value" hint={active.hint}>
          <TextInput value={value} onChange={(e) => setValue(e.target.value)} className="font-mono-ui" />
        </Field>

        <div className="flex items-center justify-center rounded-lg border border-[var(--ground-line)] bg-white p-6">
          <svg ref={svgRef} className="max-w-full text-black" />
        </div>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <button
          type="button"
          onClick={download}
          disabled={!!error}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40"
        >
          <Download size={16} /> {t("Download SVG", "ទាញយក SVG")}
        </button>
      </div>
    </ToolShell>
  );
}