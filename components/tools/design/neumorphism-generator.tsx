"use client";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

/** #rgb / #rrggbb → rgba() string. Falls back to the given default RGB on invalid input. */
function hexToRgba(hex: string, alpha: number, fallback = "163, 177, 198"): string {
  const m = hex.replace("#", "").trim();
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(${fallback}, ${alpha})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export default function NeumorphismGenerator() {
  const { text: t } = useLanguage();
  const [distance, setDistance] = useToolState("neumorphism-generator:distance", "8");
  const [blur, setBlur] = useToolState("neumorphism-generator:blur", "16");
  const [radius, setRadius] = useToolState("neumorphism-generator:radius", "16");
  const [shadowColor, setShadowColor] = useToolState("neumorphism-generator:shadow-color", "#a3b1c6");
  const [baseColor, setBaseColor] = useToolState("neumorphism-generator:base-color", "#e0e5ec");
  const [scheme, setScheme] = useToolState<"light" | "dark">("neumorphism-generator:scheme", "light");

  // Two shadows: a dark one (bottom-right) and a light one (top-left).
  const darkShadow =
    scheme === "light" ? hexToRgba(shadowColor, 0.6) : `rgba(0, 0, 0, 0.75)`;
  const lightShadow =
    scheme === "light" ? `rgba(255, 255, 255, 0.8)` : hexToRgba(shadowColor, 0.35);

  const panelStyle: React.CSSProperties = {
    background: baseColor,
    borderRadius: `${radius}px`,
    boxShadow: `${distance}px ${distance}px ${blur}px ${darkShadow}, -${distance}px -${distance}px ${blur}px ${lightShadow}`,
  };

  const css = [
    `background: ${baseColor};`,
    `border-radius: ${radius}px;`,
    `box-shadow: ${distance}px ${distance}px ${blur}px ${darkShadow},`,
    `            -${distance}px -${distance}px ${blur}px ${lightShadow};`,
  ].join("\n");

  const colorInput = "h-9 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1";

  return (
    <ToolShell
      title="Neumorphism Generator"
      khmerTitle="បង្កើត Neumorphism"
      description="Build soft UI controls with dual light/dark box-shadows on a raised surface, then copy the CSS."
      descriptionKm="បង្កើតប៊ូតុង UI ទន់ៗជាមួយស្រមោលពីរ (ស្រាល និងចាស់) នៅលើផ្ទៃប៉ោង រួចចម្លងកូដ CSS។"
    >
      <Row>
        <Field label="Distance (px)" labelKm="ចម្ងាយ (px)">
          <TextInput inputMode="numeric" value={distance} onChange={(e) => setDistance(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label="Blur (px)" labelKm="ភាពព្រិល (px)">
          <TextInput inputMode="numeric" value={blur} onChange={(e) => setBlur(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label="Border radius (px)" labelKm="កោងជ្រុង (px)">
          <TextInput inputMode="numeric" value={radius} onChange={(e) => setRadius(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label="Scheme" labelKm="របៀបពណ៌">
          <Select value={scheme} onChange={(e) => setScheme(e.target.value as "light" | "dark")}>
            <option value="light">{t("Light", "ស្រាល")}</option>
            <option value="dark">{t("Dark", "ចាស់")}</option>
          </Select>
        </Field>
      </Row>
      <Row>
        <Field label="Base color" labelKm="ពណ៌មូលដ្ឋាន">
          <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} className={colorInput} />
        </Field>
        <Field label="Shadow color" labelKm="ពណ៌ស្រមោល">
          <input type="color" value={shadowColor} onChange={(e) => setShadowColor(e.target.value)} className={colorInput} />
        </Field>
      </Row>

      <div className="flex justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] py-12">
        <div className="flex h-40 w-40 items-center justify-center" style={panelStyle}>
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-2xl text-[var(--ink)]"
            style={{
              background: baseColor,
              boxShadow: `inset ${distance}px ${distance}px ${blur}px ${darkShadow}, inset -${distance}px -${distance}px ${blur}px ${lightShadow}`,
            }}
          >
            •
          </div>
        </div>
      </div>

      <Output label={t("CSS", "កូដ CSS")} value={css} />
    </ToolShell>
  );
}
