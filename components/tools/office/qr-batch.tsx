"use client";
import { useMemo, useState } from "react";
import JSZip from "jszip";
import { Download, Loader2 } from "lucide-react";
import qrcode from "qrcode-generator";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

export default function QrBatch() {
  const { text: t } = useLanguage();
  const [input, setInput] = useState("https://123tool.app|home\nhttps://123tool.app/tools|tools");
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const entries = useMemo(
    () =>
      input
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, i) => {
          const [value, name] = line.split("|");
          return { value: value.trim(), name: (name?.trim() || `qr-${String(i + 1).padStart(3, "0")}`).replace(/[\\/:*?"<>|]/g, "-") };
        })
        .filter((e) => e.value !== ""),
    [input],
  );

  function svgFor(value: string): string {
    const qr = qrcode(0, level);
    qr.addData(value, "Byte");
    qr.make();
    return qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
  }

  async function download() {
    if (entries.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const zip = new JSZip();
      for (const entry of entries) {
        zip.file(`${entry.name}.svg`, svgFor(entry.value));
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "qr-batch.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setError(t("Could not build the ZIP — one of the values may be too long.", "មិនអាចបង្កើត ZIP បានទេ — តម្លៃមួយចំនួនអាចវែងពេក។"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="QR Batch Generator"
      khmerTitle="បង្កើត QR ជាបាច់"
      description="Turn a list of links or texts into hundreds of QR codes, downloaded together as a ZIP of SVGs."
      descriptionKm="បម្លែងបញ្ជីតំណ ឬអត្ថបទទៅជាកូដ QR ជាច្រើន ដោយទាញយកជា ZIP នៃឯកសារ SVG។"
    >
      <div className="space-y-4">
        <Field label={t("One entry per line", "មួយក្នុងមួយបន្ទាត់")} hint={t("text | file-name", "អត្ថបទ | ឈ្មោះឯកសារ")}>
          <TextArea rows={9} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" />
        </Field>

        <Field label={t("Error correction", "ការកែកំហុស")}>
          <select value={level} onChange={(e) => setLevel(e.target.value as "L" | "M" | "Q" | "H")} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]">
            <option value="L">L — 7%</option>
            <option value="M">M — 15%</option>
            <option value="Q">Q — 25%</option>
            <option value="H">H — 30%</option>
          </select>
        </Field>

        <div className="text-xs text-[var(--ink-dim)]">
          {entries.length} {t("QR codes ready", "កូដ QR រួចរាល់")}
        </div>

        <button type="button" onClick={download} disabled={busy || entries.length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {t("Download ZIP of SVGs", "ទាញយក ZIP នៃ SVG")}
        </button>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        {entries.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            {entries.slice(0, 12).map((e) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={e.name} src={`data:image/svg+xml;utf8,${encodeURIComponent(svgFor(e.value))}`} alt={e.name} className="h-20 w-20 rounded border border-[var(--ground-line)] bg-white p-1" />
            ))}
            {entries.length > 12 && (
              <div className="flex h-20 w-20 items-center justify-center rounded border border-[var(--ground-line)] text-xs text-[var(--ink-faint)]">+{entries.length - 12}</div>
            )}
          </div>
        )}
      </div>
    </ToolShell>
  );
}