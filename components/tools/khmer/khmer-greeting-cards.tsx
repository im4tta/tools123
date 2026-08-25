"use client";
import { useMemo, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { ToolShell, Field, Select, TextArea, TextInput, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { recordExport, watermarkImageDataUrl } from "@/lib/export";

// Common, well-known Khmer greetings and well-wishes by occasion. These are
// traditional expressions, provided as editable templates.
type Template = { id: string; label: string; km: string; en: string };
const TEMPLATES: Template[] = [
  { id: "newyear", label: "New Year", km: "សួស្តីឆ្នាំថ្មី! សូមឱ្យមានសេចក្តីសុខចម្រើន និងជោគជ័យក្នុងជីវិត។", en: "Happy New Year! Wishing you joy and prosperity in the year ahead." },
  { id: "bon", label: "Bon Om Touk (Water Festival)", km: "សូមអោយបុណ្យអុំទូកនេះ នាំមកនូវសេចក្តីសប្បាយ និងជោគជ័យ។", en: "May this Water Festival bring happiness and success." },
  { id: "choul", label: "Choul Chnam Thmey (Khmer New Year)", km: "រីករាយបុណ្យចូលឆ្នាំថ្មី សូមគោរពជូនពរ ចម្រើនអាយុ វ័យ ពល និងបញ្ញា។", en: "Happy Khmer New Year — may you have long life, health, and wisdom." },
  { id: "wedding", label: "Wedding", km: "រីករាយជាមួយពិធីមង្គលការ សូមឱ្យគូស្វាមីភរិយាថ្មី មានសុភមង្គលយូរអង្វែង។", en: "Congratulations on your wedding — wishing the new couple lasting happiness." },
  { id: "funeral", label: "Condolence / Funeral", km: "សូមចូលរួមរំលែកទុក្ខ និងសូមឱ្យវិញ្ញាណក្ខន្ធបានទៅកាន់សុគតិភព។", en: "My condolences — may the spirit rest in peace." },
  { id: "birthday", label: "Birthday", km: "រីករាយថ្ងៃកំណើត! សូមឱ្យអ្នកមានសុខភាពល្អ និងសុភមង្គលគ្រប់ពេល។", en: "Happy birthday! May you have good health and happiness always." },
  { id: "housewarming", label: "Housewarming", km: "រីករាយផ្ទះថ្មី! សូមឱ្យអ្នករស់នៅយូរអង្វែង និងមានសុខសាន្ត។", en: "Congratulations on your new home — may you live long and peacefully." },
  { id: "graduation", label: "Graduation", km: "សូមអបអរសាទរពិធីបញ្ចប់ការសិក្សា! សូមឱ្យជោគជ័យក្នុងអនាគត។", en: "Congratulations on graduating! Wishing you success in the future." },
] as const;

const THEMES = [
  { id: "gold", label: "Gold", bg: "#2a1a0a", accent: "#c9a227", text: "#f4eedd" },
  { id: "red", label: "Lacquer", bg: "#4a1616", accent: "#d05a44", text: "#f6ece0" },
  { id: "green", label: "Jade", bg: "#10231c", accent: "#6fae8a", text: "#eef5ef" },
  { id: "blue", label: "Indigo", bg: "#101c33", accent: "#7aa2e0", text: "#eef2fb" },
  { id: "light", label: "Ivory", bg: "#f4eedd", accent: "#b3402f", text: "#3b2a1e" },
  // Cambodian places
  { id: "angkor", label: "Angkor", bg: "#241708", accent: "#d4a94e", text: "#f7eeda" },
  { id: "tonlesap", label: "Tonlé Sap", bg: "#0c2733", accent: "#46b5cf", text: "#e9f5fa" },
  { id: "mekong", label: "Mekong", bg: "#10241a", accent: "#52b788", text: "#eaf6ef" },
  { id: "kohrong", label: "Koh Rong", bg: "#07302e", accent: "#2ec4b6", text: "#e8faf8" },
  { id: "preahvihear", label: "Preah Vihear", bg: "#1c1430", accent: "#9d8cd8", text: "#f1edfb" },
  { id: "kampot", label: "Kampot", bg: "#2b1c08", accent: "#d99a4e", text: "#f8efe0" },
] as const;

const CARD = { w: 1200, h: 1600 };

function renderCard(km: string, en: string, theme: (typeof THEMES)[number], from: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = CARD.w;
    canvas.height = CARD.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { reject(new Error("canvas")); return; }

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, CARD.w, CARD.h);

    // Decorative border.
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, CARD.w - 48, CARD.h - 48);
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, CARD.w - 80, CARD.h - 80);

    ctx.textAlign = "center";
    ctx.fillStyle = theme.text;

    // Mandate/Khmer greeting.
    const kmLines = wrapCanvas(ctx, km, "700 72px 'Kantumruy Pro', 'Noto Serif Khmer', serif", 920);
    ctx.font = "700 72px 'Kantumruy Pro', 'Noto Serif Khmer', serif";
    let y = 460;
    for (const line of kmLines) { ctx.fillText(line, CARD.w / 2, y); y += 110; }

    // English.
    const enLines = wrapCanvas(ctx, en, "400 40px Inter, sans-serif", 880);
    ctx.font = "400 40px Inter, sans-serif";
    y += 90;
    for (const line of enLines) { ctx.fillText(line, CARD.w / 2, y); y += 62; }

    // Decorative divider.
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(CARD.w / 2 - 220, 700);
    ctx.lineTo(CARD.w / 2 + 220, 700);
    ctx.stroke();

    // From.
    ctx.font = "600 34px Inter, sans-serif";
    ctx.fillStyle = theme.accent;
    if (from.trim()) ctx.fillText(from.trim(), CARD.w / 2, CARD.h - 200);

    resolve(canvas.toDataURL("image/png"));
  });
}

function wrapCanvas(ctx: CanvasRenderingContext2D, text: string, font: string, maxWidth: number): string[] {
  const chunks = text.split("\n");
  const out: string[] = [];
  ctx.font = font;
  for (const chunk of chunks) {
    const words = chunk.split(/\s+/).filter(Boolean);
    if (words.length === 0) { out.push(""); continue; }
    let line = words[0];
    for (let i = 1; i < words.length; i++) {
      const test = `${line} ${words[i]}`;
      if (ctx.measureText(test).width <= maxWidth) line = test;
      else { out.push(line); line = words[i]; }
    }
    out.push(line);
  }
  return out;
}

export default function KhmerGreetingCards() {
  const { text: t } = useLanguage();
  const [templateId, setTemplateId] = useToolState("khmer-cards:template", "newyear");
  const [themeId, setThemeId] = useToolState("khmer-cards:theme", "gold");
  const [km, setKm] = useToolState("khmer-cards:km", TEMPLATES[0].km);
  const [en, setEn] = useToolState("khmer-cards:en", TEMPLATES[0].en);
  const [from, setFrom] = useToolState("khmer-cards:from", "");
  const [preview, setPreview] = useState<string | null>(null);

  const theme = useMemo(() => THEMES.find((x) => x.id === themeId) ?? THEMES[0], [themeId]);
  const template = useMemo(() => TEMPLATES.find((x) => x.id === templateId) ?? TEMPLATES[0], [templateId]);

  function loadTemplate(id: string) {
    const found = TEMPLATES.find((x) => x.id === id);
    if (!found) return;
    setTemplateId(id);
    setKm(found.km);
    setEn(found.en);
  }

  async function render() {
    const url = await renderCard(km, en, theme, from);
    setPreview(url);
  }

  async function download() {
    if (!preview) return;
    const watermarked = await watermarkImageDataUrl(preview, "image/png");
    const a = document.createElement("a");
    a.href = watermarked;
    a.download = `${template.id}-card.png`;
    a.click();
    recordExport();
  }

  return (
    <ToolShell
      title="Khmer Greeting Cards"
      khmerTitle="កាតជូនពរខ្មែរ"
      description="Make an elegant Khmer greeting or well-wish card from traditional templates — new year, wedding, condolence, and more — and export it as a PNG."
      descriptionKm="បង្កើតកាតជូនពរខ្មែរដ៏ស្រស់ស្អាតពីគំរូបុរាណ — ចូលឆ្នាំថ្មី អាពាហ៍ពិពាហ៍ រំលែកទុក្ខ និងច្រើនទៀត — រួចនាំចេញជា PNG។"
    >
      <Row>
        <Field label={t("Occasion", "ឱកាស")}>
          <Select value={templateId} onChange={(e) => loadTemplate(e.target.value)}>
            {TEMPLATES.map((x) => (
              <option key={x.id} value={x.id}>{x.label}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Theme", "ពណ៌")}>
          <Select value={themeId} onChange={(e) => setThemeId(e.target.value)}>
            {THEMES.map((x) => (
              <option key={x.id} value={x.id}>{x.label}</option>
            ))}
          </Select>
        </Field>
      </Row>

      <Field label={t("Khmer message", "សារជាភាសាខ្មែរ")}>
        <TextArea rows={3} value={km} onChange={(e) => setKm(e.target.value)} />
      </Field>
      <Field label={t("English (optional)", "អង់គ្លេស (ជាជម្រើស)")}>
        <TextArea rows={2} value={en} onChange={(e) => setEn(e.target.value)} />
      </Field>
      <Field label={t("From / signature", "ពី / ហត្ថលេខា")}>
        <TextInput value={from} onChange={(e) => setFrom(e.target.value)} placeholder={t("Optional name", "ឈ្មោះជាជម្រើស")} />
      </Field>

      <Row>
        <Button onClick={render} disabled={!km.trim()}>{t("Preview", "មើលជាមុន")}</Button>
        {preview && (
          <Button onClick={download}>
            <Download size={15} className="mr-1 inline" />
            {t("Download", "ទាញយក")}
          </Button>
        )}
      </Row>

      {preview && (
        <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Greeting card" className="mx-auto max-h-[480px] rounded-sm" />
        </div>
      )}

      <div className="flex items-start gap-2 text-[11px] text-[var(--ink-faint)]">
        <ExternalLink size={12} className="mt-0.5 shrink-0" />
        <span>
          {t("Templates are common traditional Khmer well-wishes; you can edit the text freely. Generated entirely in your browser.", "គំរូជាការជូនពរបុរាណខ្មែរទូទៅ អ្នកអាចកែសម្រួលអត្ថបទដោយសេរី។ បង្កើតទាំងស្រុងក្នុងកម្មវិធីរុករក។")}
        </span>
      </div>
    </ToolShell>
  );
}
