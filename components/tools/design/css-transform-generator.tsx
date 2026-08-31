"use client";
import { useMemo } from "react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const ORIGINS = [
  { value: "center", label: "Center", labelKm: "កណ្ដាល" },
  { value: "top", label: "Top", labelKm: "ខាងលើ" },
  { value: "top left", label: "Top left", labelKm: "ខាងលើឆ្វេង" },
  { value: "top right", label: "Top right", labelKm: "ខាងលើស្ដាំ" },
  { value: "bottom", label: "Bottom", labelKm: "ខាងក្រោម" },
  { value: "bottom left", label: "Bottom left", labelKm: "ខាងក្រោមឆ្វេង" },
  { value: "bottom right", label: "Bottom right", labelKm: "ខាងក្រោមស្ដាំ" },
  { value: "left", label: "Left", labelKm: "ឆ្វេង" },
  { value: "right", label: "Right", labelKm: "ស្ដាំ" },
];

function slider(label: string, value: number, setter: (v: string) => void, min: number, max: number, step: number, unit: string) {
  return (
    <Field label={label}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => setter(e.target.value)} className="w-full accent-[var(--gold)]" />
      <div className="mt-1 text-xs font-mono-ui text-[var(--ink-dim)]">{value}{unit}</div>
    </Field>
  );
}

export default function CssTransformGenerator() {
  const { text: t } = useLanguage();
  const [tx, setTx] = useToolState("css-transform:tx", "40");
  const [ty, setTy] = useToolState("css-transform:ty", "10");
  const [rot, setRot] = useToolState("css-transform:rot", "15");
  const [sx, setSx] = useToolState("css-transform:sx", "1.2");
  const [sy, setSy] = useToolState("css-transform:sy", "1");
  const [skx, setSkx] = useToolState("css-transform:skx", "5");
  const [sky, setSky] = useToolState("css-transform:sky", "0");
  const [perspectiveStr, setPerspectiveStr] = useToolState("css-transform:perspective", "600");
  const [origin, setOrigin] = useToolState("css-transform:origin", "center");

  const perspective = Math.max(0, Math.min(1200, Number(perspectiveStr) || 0));

  const transformValue = useMemo(
    () => `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${sx}, ${sy}) skew(${skx}deg, ${sky}deg)`,
    [tx, ty, rot, sx, sy, skx, sky]
  );

  const css = useMemo(() => {
    const container = perspective > 0 ? `.container {\n  perspective: ${perspective}px;\n}\n\n` : "";
    return `${container}.box {\n  transform: ${transformValue};\n  transform-origin: ${origin};\n}`;
  }, [perspective, transformValue, origin]);

  return (
    <ToolShell
      title="CSS Transform Generator"
      khmerTitle="បង្កើត CSS Transform"
      description="Tune translate, rotate, scale, skew, perspective and transform-origin on a live sample box, then copy the CSS."
      descriptionKm="លៃតម្រូវ translate rotate scale skew perspective និង transform-origin លើប្រអប់គំរូផ្ទាល់ រួចចម្លងកូដ CSS។"
    >
      <Row>
        {slider(t("Translate X (px)", "ផ្លាស់ទី X (px)"), Number(tx), setTx, -200, 200, 5, "px")}
        {slider(t("Translate Y (px)", "ផ្លាស់ទី Y (px)"), Number(ty), setTy, -200, 200, 5, "px")}
        {slider(t("Rotate (deg)", "បង្វិល (ដឺក្រេ)"), Number(rot), setRot, -180, 180, 1, "°")}
        {slider(t("Scale X", "ធ្វើមាត្រដ្ឋាន X"), Number(sx), setSx, 0.2, 3, 0.05, "×")}
      </Row>
      <Row>
        {slider(t("Scale Y", "ធ្វើមាត្រដ្ឋាន Y"), Number(sy), setSy, 0.2, 3, 0.05, "×")}
        {slider(t("Skew X (deg)", "ផ្អៀង X (ដឺក្រេ)"), Number(skx), setSkx, -45, 45, 1, "°")}
        {slider(t("Skew Y (deg)", "ផ្អៀង Y (ដឺក្រេ)"), Number(sky), setSky, -45, 45, 1, "°")}
        {slider(t("Perspective (px)", "Perspective (px)"), perspective, setPerspectiveStr, 0, 1200, 25, perspective > 0 ? "px" : " (off)")}
      </Row>
      <Row>
        <Field label={t("Transform origin", "ចំណុចចាប់ផ្ដើម")}>
          <Select value={origin} onChange={(e) => setOrigin(e.target.value)}>
            {ORIGINS.map((o) => (
              <option key={o.value} value={o.value}>{t(o.label, o.labelKm)}</option>
            ))}
          </Select>
        </Field>
      </Row>

      <div
        className="relative overflow-hidden rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-6 py-20"
        style={perspective > 0 ? { perspective: `${perspective}px` } : undefined}
      >
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(var(--ground-line)_1px,transparent_1px),linear-gradient(90deg,var(--ground-line)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div
          className="relative mx-auto flex h-32 w-44 items-center justify-center rounded-md border border-[var(--gold-dim)] bg-[var(--gold)]/15 text-sm font-medium text-[var(--gold)]"
          style={{ transform: transformValue, transformOrigin: origin, transition: "transform 0.1s linear" }}
        >
          {t("Sample", "គំរូ")}
        </div>
      </div>

      <Output label={t("CSS", "កូដ CSS")} value={css} />
    </ToolShell>
  );
}
