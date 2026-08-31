"use client";
import { useMemo } from "react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const SPEEDS = [
  { value: "600", label: "Fast (0.6s)", labelKm: "លឿន (0.6s)" },
  { value: "1200", label: "Normal (1.2s)", labelKm: "ធម្មតា (1.2s)" },
  { value: "2000", label: "Slow (2s)", labelKm: "យឺត (2s)" },
];

const STYLES = [
  { value: "ring", label: "Ring", labelKm: "រង្វង់" },
  { value: "dots", label: "Dots", labelKm: "ចំណុច" },
  { value: "bar", label: "Bar", labelKm: "របារ" },
  { value: "dual-ring", label: "Dual ring", labelKm: "រង្វង់ពីរ" },
  { value: "wave", label: "Wave", labelKm: "រលក" },
];

const TRACK = "rgba(127,127,127,0.35)";

function sec(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function LoadingSpinnerGenerator() {
  const { text: t } = useLanguage();
  const [style, setStyle] = useToolState("loading-spinner:style", "ring");
  const [color, setColor] = useToolState("loading-spinner:color", "#c9a24b");
  const [sizeStr, setSizeStr] = useToolState("loading-spinner:size", "48");
  const [speedStr, setSpeedStr] = useToolState("loading-spinner:speed", "1200");
  const [thicknessStr, setThicknessStr] = useToolState("loading-spinner:thickness", "4");

  const size = Math.max(8, Math.min(160, Number(sizeStr) || 48));
  const speed = Number(speedStr) || 1200;
  const thickness = Math.max(1, Math.min(24, Number(thicknessStr) || 4));

  const css = useMemo(() => {
    const ring = [
      `.spinner-ring {`,
      `  width: ${size}px;`,
      `  height: ${size}px;`,
      `  border: ${thickness}px solid ${TRACK};`,
      `  border-top-color: ${color};`,
      `  border-radius: 50%;`,
      `  animation: spinner-ring ${sec(speed)} linear infinite;`,
      `}`,
      `@keyframes spinner-ring { to { transform: rotate(360deg); } }`,
    ].join("\n");

    const dots = [
      `.spinner-dots { display: flex; gap: ${Math.max(4, Math.round(size / 8))}px; }`,
      `.spinner-dots span {`,
      `  width: ${Math.max(6, Math.round(size / 4))}px;`,
      `  height: ${Math.max(6, Math.round(size / 4))}px;`,
      `  border-radius: 50%;`,
      `  background: ${color};`,
      `  animation: spinner-dots ${sec(speed)} ease-in-out infinite;`,
      `}`,
      ...Array.from({ length: 3 }, (_, i) => `.spinner-dots span:nth-child(${i + 1}) { animation-delay: ${sec((speed / 5) * i)}; }`),
      `@keyframes spinner-dots { 0%, 80%, 100% { transform: scale(0.4); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }`,
    ].join("\n");

    const bar = [
      `.spinner-bar {`,
      `  position: relative;`,
      `  width: ${Math.max(120, size * 3)}px;`,
      `  height: ${thickness}px;`,
      `  border-radius: 999px;`,
      `  background: ${TRACK};`,
      `  overflow: hidden;`,
      `}`,
      `.spinner-bar::after {`,
      `  content: "";`,
      `  position: absolute;`,
      `  top: 0; left: 0;`,
      `  width: 40%; height: 100%;`,
      `  border-radius: 999px;`,
      `  background: ${color};`,
      `  animation: spinner-bar ${sec(speed)} ease-in-out infinite;`,
      `}`,
      `@keyframes spinner-bar { 0% { left: -40%; } 100% { left: 100%; } }`,
    ].join("\n");

    const dualRing = [
      `.spinner-dual-ring {`,
      `  position: relative;`,
      `  width: ${size}px;`,
      `  height: ${size}px;`,
      `}`,
      `.spinner-dual-ring::before,`,
      `.spinner-dual-ring::after {`,
      `  content: "";`,
      `  position: absolute;`,
      `  inset: 0;`,
      `  border-radius: 50%;`,
      `  border: ${thickness}px solid ${TRACK};`,
      `}`,
      `.spinner-dual-ring::before {`,
      `  border-top-color: ${color};`,
      `  animation: spinner-dual ${sec(speed)} linear infinite;`,
      `}`,
      `.spinner-dual-ring::after {`,
      `  border-bottom-color: ${color};`,
      `  animation: spinner-dual ${sec(speed / 2)} linear infinite;`,
      `}`,
      `@keyframes spinner-dual { to { transform: rotate(360deg); } }`,
    ].join("\n");

    const waveBar = Math.max(3, Math.round(thickness * 1.4));
    const wave = [
      `.spinner-wave { display: flex; align-items: center; gap: 4px; height: ${size}px; }`,
      `.spinner-wave span {`,
      `  width: ${waveBar}px;`,
      `  height: 100%;`,
      `  border-radius: 999px;`,
      `  background: ${color};`,
      `  animation: spinner-wave ${sec(speed)} ease-in-out infinite;`,
      `}`,
      ...Array.from({ length: 5 }, (_, i) => `.spinner-wave span:nth-child(${i + 1}) { animation-delay: ${sec((speed / 10) * i)}; }`),
      `@keyframes spinner-wave { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }`,
    ].join("\n");

    const blocks: Record<string, string> = { ring, dots, bar, "dual-ring": dualRing, wave };
    return blocks[style] ?? ring;
  }, [style, color, size, speed, thickness]);

  const preview = (
    <div className="flex h-48 items-center justify-center">
      {style === "ring" && <div className="spinner-ring" />}
      {style === "dots" && (
        <div className="spinner-dots">
          <span /><span /><span />
        </div>
      )}
      {style === "bar" && <div className="spinner-bar" />}
      {style === "dual-ring" && <div className="spinner-dual-ring" />}
      {style === "wave" && (
        <div className="spinner-wave">
          <span /><span /><span /><span /><span />
        </div>
      )}
    </div>
  );

  const colorInput = "h-9 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1";

  return (
    <ToolShell
      title="Loading Spinner Generator"
      khmerTitle="បង្កើត Loading Spinner"
      description="Pick a spinner style, colors, size, speed and thickness, watch it animate live, then copy the CSS."
      descriptionKm="ជ្រើសរើសរចនាបថ spinner ពណ៌ ទំហំ ល្បឿន និងកម្រាស់ មើលចលនាផ្ទាល់ រួចចម្លងកូដ CSS។"
    >
      <Row>
        <Field label={t("Style", "រចនាបថ")}>
          <Select value={style} onChange={(e) => setStyle(e.target.value)}>
            {STYLES.map((s) => (
              <option key={s.value} value={s.value}>{t(s.label, s.labelKm)}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Color", "ពណ៌")}>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className={colorInput} />
        </Field>
        <Field label={t("Size (px)", "ទំហំ (px)")}>
          <input type="range" min={16} max={120} step={4} value={size} onChange={(e) => setSizeStr(e.target.value)} className="w-full accent-[var(--gold)]" />
          <div className="mt-1 text-xs font-mono-ui text-[var(--ink-dim)]">{size}px</div>
        </Field>
        <Field label={t("Speed", "ល្បឿន")}>
          <Select value={speedStr} onChange={(e) => setSpeedStr(e.target.value)}>
            {SPEEDS.map((s) => (
              <option key={s.value} value={s.value}>{t(s.label, s.labelKm)}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Thickness (px)", "កម្រាស់ (px)")}>
          <input type="range" min={1} max={16} step={1} value={thickness} onChange={(e) => setThicknessStr(e.target.value)} className="w-full accent-[var(--gold)]" />
          <div className="mt-1 text-xs font-mono-ui text-[var(--ink-dim)]">{thickness}px</div>
        </Field>
      </Row>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]">
        <style>{css}</style>
        {preview}
      </div>

      <Output label={t("CSS", "កូដ CSS")} value={css} />
    </ToolShell>
  );
}
