"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Property = "translateX" | "translateY" | "rotate" | "scale" | "opacity";

const PROPERTIES: { id: Property; en: string; km: string; unit: string; from: string; to: string; step: string }[] = [
  { id: "translateX", en: "Move horizontally", km: "ផ្លាស់ទីផ្តេក", unit: "px", from: "0", to: "120", step: "1" },
  { id: "translateY", en: "Move vertically", km: "ផ្លាស់ទីបញ្ឈរ", unit: "px", from: "0", to: "80", step: "1" },
  { id: "rotate", en: "Rotate", km: "បង្វិល", unit: "deg", from: "0", to: "360", step: "1" },
  { id: "scale", en: "Scale", km: "ពង្រីក/បន្ថយទំហំ", unit: "", from: "1", to: "1.4", step: "0.05" },
  { id: "opacity", en: "Fade (opacity)", km: "ភាពថ្លា (opacity)", unit: "", from: "1", to: "0.2", step: "0.05" },
];
const EASINGS: { id: string; value: string; en: string; km: string }[] = [
  { id: "linear", value: "linear", en: "Linear", km: "លីនេអ៊ែរ" },
  { id: "ease", value: "ease", en: "Ease (default)", km: "Ease (លំនាំដើម)" },
  { id: "ease-in", value: "ease-in", en: "Ease in", km: "Ease in" },
  { id: "ease-out", value: "ease-out", en: "Ease out", km: "Ease out" },
  { id: "ease-in-out", value: "ease-in-out", en: "Ease in-out", km: "Ease in-out" },
  { id: "custom", value: "cubic-bezier(0.68, -0.55, 0.27, 1.55)", en: "Custom cubic-bezier…", km: "Custom cubic-bezier…" },
];
const DIRECTIONS = ["normal", "reverse", "alternate", "alternate-reverse"] as const;
const FILLS = ["none", "forwards", "backwards", "both"] as const;

export default function CssAnimationGenerator() {
  const { text: t } = useLanguage();
  const [property, setProperty] = useToolState<Property>("css-anim:prop", "translateX");
  const [from, setFrom] = useToolState("css-anim:from", "0");
  const [to, setTo] = useToolState("css-anim:to", "120");
  const [duration, setDuration] = useToolState("css-anim:duration", "1500");
  const [delay, setDelay] = useToolState("css-anim:delay", "0");
  const [easingId, setEasingId] = useToolState("css-anim:easing", "ease-in-out");
  const [bezier, setBezier] = useToolState("css-anim:bezier", "0.68, -0.55, 0.27, 1.55");
  const [iteration, setIteration] = useToolState("css-anim:iteration", "infinite");
  const [direction, setDirection] = useToolState("css-anim:direction", "alternate");
  const [fill, setFill] = useToolState("css-anim:fill", "none");
  const [key, setKey] = useState(0);

  const prop = PROPERTIES.find((p) => p.id === property) ?? PROPERTIES[0];
  const easingValue = easingId === "custom" ? `cubic-bezier(${bezier.trim()})` : (EASINGS.find((e) => e.id === easingId) ?? EASINGS[1]).value;
  const unit = prop.unit;
  const iterationValue = iteration === "infinite" ? "infinite" : String(Math.max(1, Number(iteration) || 1));

  const code = useMemo(() => `.demo-element {
  animation: demo-animation ${duration}ms ${easingValue} ${delay}ms ${iterationValue} ${direction} ${fill};
}

@keyframes demo-animation {
  from {
    ${property}: ${from}${unit};
  }
  to {
    ${property}: ${to}${unit};
  }
}`, [property, from, to, unit, duration, delay, easingValue, iterationValue, direction, fill]);

  const styleFor = (value: string) => (property === "opacity" ? `opacity: ${value};` : `transform: ${property === "rotate" ? `rotate(${value}deg)` : property === "scale" ? `scale(${value})` : `${property}(${value}px)`};`);
  const styleBlock = `@keyframes demo-preview {
  from { ${styleFor(from)} }
  to { ${styleFor(to)} }
}
.demo-preview-run {
  animation: demo-preview ${duration}ms ${easingValue} ${delay}ms ${iterationValue} ${direction} ${fill};
}`;

  return (
    <ToolShell
      title="CSS Animation Generator"
      khmerTitle="បង្កើត Animation CSS"
      description="Compose a keyframes animation visually — pick a property, easing curve (including custom cubic-bezier), duration, delay, and iteration — then copy the CSS."
      descriptionKm="បង្កើត animation បែប keyframes ដោយមើលឃើញ — ជ្រើសរើសលក្ខណៈសម្បត្តិ ខ្សែកោង easing (រួមទាំង cubic-bezier ផ្ទាល់ខ្លួន) រយៈពេល និងចំនួនវគ្គ — រួចចម្លងកូដ CSS។"
    >
      <style>{styleBlock}</style>
      <Row>
        <Field label={t("Property", "លក្ខណៈសម្បត្តិ")}>
          <Select value={property} onChange={(e) => { const next = e.target.value as Property; setProperty(next); const def = PROPERTIES.find((p) => p.id === next); if (def) { setFrom(def.from); setTo(def.to); } setKey((k) => k + 1); }}>
            {PROPERTIES.map((p) => <option key={p.id} value={p.id}>{t(p.en, p.km)}</option>)}
          </Select>
        </Field>
        <Field label={t("Easing", "ខ្សែកោង easing")}>
          <Select value={easingId} onChange={(e) => { setEasingId(e.target.value); setKey((k) => k + 1); }}>
            {EASINGS.map((e) => <option key={e.id} value={e.id}>{t(e.en, e.km)}</option>)}
          </Select>
        </Field>
      </Row>
      <Row>
        <Field label={t("From value", "តម្លៃចាប់ផ្តើម")}>
          <input type="number" step={prop.step} value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)] focus:ring-1 focus:ring-[var(--gold-dim)]" />
        </Field>
        <Field label={t("To value", "តម្លៃបញ្ចប់")}>
          <input type="number" step={prop.step} value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)] focus:ring-1 focus:ring-[var(--gold-dim)]" />
        </Field>
      </Row>
      <Row>
        <Field label={t("Duration (ms)", "រយៈពេល (ms)")}>
          <input type="number" min="0" step="50" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)] focus:ring-1 focus:ring-[var(--gold-dim)]" />
        </Field>
        <Field label={t("Delay (ms)", "ពន្យារ (ms)")}>
          <input type="number" min="0" step="50" value={delay} onChange={(e) => setDelay(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)] focus:ring-1 focus:ring-[var(--gold-dim)]" />
        </Field>
      </Row>
      {easingId === "custom" && (
        <Field label={t("Cubic-bezier (x1, y1, x2, y2)", "Cubic-bezier (x១, y១, x២, y២)")} hintKm={t("x in 0…1", "x ក្នុង ០…១")}>
          <input value={bezier} onChange={(e) => { setBezier(e.target.value); setKey((k) => k + 1); }} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 font-mono-ui text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)] focus:ring-1 focus:ring-[var(--gold-dim)]" />
        </Field>
      )}
      <Row>
        <Field label={t("Iterations", "ចំនួនវគ្គ")}>
          <Select value={iteration} onChange={(e) => { setIteration(e.target.value); setKey((k) => k + 1); }}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="infinite">{t("Infinite", "គ្មានដែនកំណត់")}</option>
          </Select>
        </Field>
        <Field label={t("Direction", "ទិសដៅ")}>
          <Select value={direction} onChange={(e) => { setDirection(e.target.value); setKey((k) => k + 1); }}>
            {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </Field>
      </Row>
      <Field label={t("Fill mode", "របៀប fill")}>
        <Select value={fill} onChange={(e) => { setFill(e.target.value); setKey((k) => k + 1); }} className="w-56">
          {FILLS.map((f) => <option key={f} value={f}>{f}</option>)}
        </Select>
      </Field>

      <div className="flex min-h-32 items-center justify-center overflow-hidden rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <div key={key} className="demo-preview-run h-16 w-16 rounded-lg bg-[var(--gold)]" />
      </div>

      <Output label={t("CSS", "CSS")} value={code} />

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t("Generates standard CSS keyframes and the animation shorthand. The preview restarts when you change a value. Custom cubic-bezier values follow the CSS spec; y values may leave 0…1 for overshoot effects while x must stay within 0…1.", "បង្កើត CSS keyframes ស្តង់ដារ និង animation shorthand។ ការមើលជាមុនចាប់ផ្តើមឡើងវិញពេលប្ដូរតម្លៃ។ តម្លៃ cubic-bezier ផ្ទាល់ខ្លួនតាមស្តង់ដារ CSS; y អាចចេញក្រៅ ០…១ សម្រាប់បែបលោត ខណៈ x ត្រូវស្ថិតក្នុង ០…១។")}
      </p>
    </ToolShell>
  );
}

