"use client";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

/** #rgb / #rrggbb → rgba() string. Falls back to white for invalid input. */
function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "").trim();
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(255, 255, 255, ${alpha})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export default function GlassmorphismGenerator() {
  const { text: t } = useLanguage();
  const [blur, setBlur] = useToolState("glassmorphism-generator:blur", "16");
  const [opacity, setOpacity] = useToolState("glassmorphism-generator:opacity", "25");
  const [borderWidth, setBorderWidth] = useToolState("glassmorphism-generator:border-width", "1");
  const [borderColor, setBorderColor] = useToolState("glassmorphism-generator:border-color", "#ffffff");
  const [radius, setRadius] = useToolState("glassmorphism-generator:radius", "16");
  const [shadow, setShadow] = useToolState("glassmorphism-generator:shadow", true);
  const [tint, setTint] = useToolState("glassmorphism-generator:tint", "#ffffff");

  const alpha = Math.max(0, Math.min(100, Number(opacity) || 0)) / 100;
  const panelStyle: React.CSSProperties = {
    background: hexToRgba(tint, alpha),
    backdropFilter: `blur(${blur}px) saturate(160%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(160%)`,
    border: `${borderWidth}px solid ${hexToRgba(borderColor, 0.6)}`,
    borderRadius: `${radius}px`,
    boxShadow: shadow ? "0 8px 32px rgba(0, 0, 0, 0.25)" : "none",
  };

  const css = [
    `background: ${hexToRgba(tint, alpha)};`,
    `backdrop-filter: blur(${blur}px) saturate(160%);`,
    `-webkit-backdrop-filter: blur(${blur}px) saturate(160%);`,
    `border: ${borderWidth}px solid ${hexToRgba(borderColor, 0.6)};`,
    `border-radius: ${radius}px;`,
    ...(shadow ? [`box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);`] : []),
  ].join("\n");

  const colorInput = "h-9 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1";

  return (
    <ToolShell
      title="Glassmorphism Generator"
      khmerTitle="បង្កើត Glassmorphism"
      description="Design a frosted-glass panel with backdrop blur, tint, border, and shadow, then copy the CSS."
      descriptionKm="រចនាបន្ទះកែវអ័ព្ទជាមួយ backdrop blur ពណ៌លាយ ស៊ុម និងស្រមោល រួចចម្លងកូដ CSS។"
    >
      <Row>
        <Field label="Blur (px)" labelKm="ភាពព្រិល (px)">
          <TextInput inputMode="numeric" value={blur} onChange={(e) => setBlur(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label="Opacity (%)" labelKm="ភាពថ្លា (%)">
          <TextInput inputMode="numeric" value={opacity} onChange={(e) => setOpacity(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label="Border width (px)" labelKm="ទទឹងស៊ុម (px)">
          <TextInput inputMode="numeric" value={borderWidth} onChange={(e) => setBorderWidth(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label="Border radius (px)" labelKm="កោងជ្រុង (px)">
          <TextInput inputMode="numeric" value={radius} onChange={(e) => setRadius(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>
      <Row>
        <Field label="Tint color" labelKm="ពណ៌លាយ">
          <input type="color" value={tint} onChange={(e) => setTint(e.target.value)} className={colorInput} />
        </Field>
        <Field label="Border color" labelKm="ពណ៌ស៊ុម">
          <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className={colorInput} />
        </Field>
        <Field label="Shadow" labelKm="ស្រមោល">
          <label className="flex h-9 items-center gap-2 text-sm text-[var(--ink)]">
            <input type="checkbox" checked={shadow} onChange={(e) => setShadow(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
            {t("Drop shadow", "ស្រមោលខាងក្រោម")}
          </label>
        </Field>
      </Row>

      <div className="relative overflow-hidden rounded-md border border-[var(--ground-line)] bg-gradient-to-br from-[#667eea] via-[#a06bec] to-[#f27c96] px-6 py-12 sm:px-10">
        <div className="pointer-events-none absolute -left-6 -top-8 h-28 w-28 rounded-full bg-[#ffd166]/50 blur-xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-4 h-32 w-32 rounded-full bg-[#4cc9f0]/50 blur-xl" />
        <div className="mx-auto max-w-md space-y-4 p-5 text-white" style={panelStyle}>
          <div className="text-lg font-semibold">{t("Glass Panel", "ក្ដារកែវ")}</div>
          <p className="text-sm leading-relaxed">
            {t("Frosted glass UI with backdrop blur over a colorful gradient.", "ក្ដារកែវអ័ព្ទជាមួយ backdrop blur ពីលើផ្ទៃខាងក្រោយចម្រុះពណ៌។")}
          </p>
        </div>
      </div>

      <Output label={t("CSS", "កូដ CSS")} value={css} />

      <aside className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-xs leading-relaxed text-[var(--ink-dim)]">
        <p className="mb-2 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</p>
        <p>
          {t("Inspired by the glassmorphism UI trend — the term was coined by Michal Malewicz (UX Collective, Nov 2020) and popularized by Apple's macOS Big Sur design language. This generator is an independent, original implementation by Tools123.", "បំផុសគំនិតដោយនិន្នាការ UI glassmorphism — ពាក្យនេះបង្កើតឡើងដោយ Michal Malewicz (UX Collective ខែវិច្ឆិកា ២០២០) ហើយត្រូវបានផ្សព្វផ្សាយដោយរចនាបថ macOS Big Sur របស់ Apple។ ឧបករណ៍នេះជាការអនុវត្តឯករាជ្យដើមរបស់ Tools123។")}{" "}
          <a href="https://uxdesign.cc/glassmorphism-in-user-interfaces-1f39bb1308c9" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">uxdesign.cc</a>
        </p>
      </aside>
    </ToolShell>
  );
}
