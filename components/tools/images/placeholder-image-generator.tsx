"use client";
import { useMemo } from "react";
import { Download } from "lucide-react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default function PlaceholderImageGenerator() {
  const { text: t } = useLanguage();
  const [width, setWidth] = useToolState("placeholder:width", "640");
  const [height, setHeight] = useToolState("placeholder:height", "360");
  const [text, setText] = useToolState("placeholder:text", "");
  const [bg, setBg] = useToolState("placeholder:bg", "#c9a24b");
  const [fg, setFg] = useToolState("placeholder:fg", "#ffffff");
  const [radius, setRadius] = useToolState("placeholder:radius", "0");

  const svg = useMemo(() => {
    const W = Math.max(1, Math.min(4000, Number(width) || 1));
    const H = Math.max(1, Math.min(4000, Number(height) || 1));
    const R = Math.max(0, Math.min(Math.min(W, H) / 2, Number(radius) || 0));
    const label = text.trim() || `${W} × ${H}`;
    const fs = Math.max(8, Math.min(H * 0.4, (W * 0.8) / Math.max(1, label.length * 0.6 + 1.5)));
    const rx = R > 0 ? ` rx="${R}"` : "";
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
      `<rect width="100%" height="100%" fill="${bg}"${rx}/>` +
      `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fs.toFixed(1)}" fill="${fg}">${escapeXml(label)}</text>` +
      `</svg>`
    );
  }, [width, height, text, bg, fg, radius]);

  const previewSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  function download() {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "placeholder.svg";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  return (
    <ToolShell
      title="Placeholder Image Generator"
      khmerTitle="បង្កើតរូបភាព Placeholder"
      description="Create a clean SVG placeholder with your own size, text and colors — copy the markup or download the file."
      descriptionKm="បង្កើតរូបភាព Placeholder SVG ស្អាតៗ ជាមួយទំហំ អត្ថបទ និងពណ៌ផ្ទាល់ខ្លួន — ចម្លងកូដ ឬទាញយកឯកសារ។"
    >
      <div className="space-y-4">
        <Row>
          <Field label={t("Width (px)", "ទទឹង (px)")}>
            <TextInput inputMode="numeric" value={width} onChange={(e) => setWidth(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label={t("Height (px)", "កម្ពស់ (px)")}>
            <TextInput inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label={t("Text", "អត្ថបទ")} hint={t("empty = size", "ទទេ = ទំហំ")}>
            <TextInput value={text} onChange={(e) => setText(e.target.value)} placeholder={t("e.g. Hero banner", "ឧ. បដា Hero")} />
          </Field>
          <Field label={t("Corner radius (px)", "កាំជ្រុង (px)")} hint={t("0 = square", "០ = ការ៉េ")}>
            <TextInput inputMode="numeric" value={radius} onChange={(e) => setRadius(e.target.value)} className="font-mono-ui" />
          </Field>
          <Field label={t("Background color", "ពណ៌ផ្ទៃខាងក្រោយ")}>
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-10 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-1" />
          </Field>
          <Field label={t("Text color", "ពណ៌អក្សរ")}>
            <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-10 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-1" />
          </Field>
        </Row>

        <div className="rounded-lg border border-[var(--ground-line)] bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewSrc} alt={t("Placeholder preview", "មើល Placeholder ជាមុន")} className="mx-auto max-h-96" />
        </div>

        <Output value={svg} label={t("SVG markup", "កូដ SVG")} />

        <Button type="button" onClick={download} className="w-full">
          <Download size={15} className="mr-1.5 inline" />
          {t("Download SVG", "ទាញយក SVG")}
        </Button>
      </div>
    </ToolShell>
  );
}
