"use client";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Layer = { x: string; y: string; blur: string; color: string };
type State = { layers: Layer[]; text: string; size: string };

const DEFAULT_LAYERS: Layer[] = [
  { x: "2", y: "2", blur: "4", color: "rgba(0, 0, 0, 0.4)" },
  { x: "0", y: "0", blur: "14", color: "rgba(0, 0, 0, 0.25)" },
];

export default function TextShadowGenerator() {
  const { text: t } = useLanguage();
  const [state, setState] = useToolState<State>("text-shadow-generator:state", {
    layers: DEFAULT_LAYERS,
    text: "Hello",
    size: "64",
  });

  const updateLayer = (i: number, patch: Partial<Layer>) =>
    setState((s) => ({
      ...s,
      layers: s.layers.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
    }));

  const addLayer = () =>
    setState((s) => ({
      ...s,
      layers: [...s.layers, { x: "0", y: "0", blur: "6", color: "rgba(0, 0, 0, 0.35)" }],
    }));

  const removeLayer = (i: number) =>
    setState((s) => ({ ...s, layers: s.layers.filter((_, idx) => idx !== i) }));

  const shadows = state.layers.map(
    (l) => `${l.x || 0}px ${l.y || 0}px ${l.blur || 0}px ${l.color}`
  );
  const css = shadows.length ? shadows.join(", ") : "none";

  const layerInput = "font-mono-ui";

  return (
    <ToolShell
      title="Text Shadow Generator"
      khmerTitle="បង្កើតស្រមោលអត្ថបទ"
      description="Stack multiple text-shadow layers, tune offset/blur/color per layer, and copy the CSS."
      descriptionKm="ដាក់ស្រមោលអត្ថបទច្រើនស្រទាប់ លៃតម្រូវការផ្លាស់ទី/ភាពព្រិល/ពណ៌នៃស្រទាប់នីមួយៗ រួចចម្លងកូដ CSS។"
    >
      <Row>
        <Field label="Sample text" labelKm="អត្ថបទគំរូ">
          <TextInput value={state.text} onChange={(e) => setState((s) => ({ ...s, text: e.target.value }))} />
        </Field>
        <Field label="Font size (px)" labelKm="ទំហំអក្សរ (px)">
          <TextInput inputMode="numeric" value={state.size} onChange={(e) => setState((s) => ({ ...s, size: e.target.value }))} className="font-mono-ui" />
        </Field>
      </Row>

      <div className="flex min-h-44 items-center justify-center overflow-hidden rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-10">
        <span
          className="max-w-full break-words font-display font-bold"
          style={{ fontSize: `${state.size || 16}px`, color: "var(--ink)", textShadow: css }}
        >
          {state.text || " "}
        </span>
      </div>

      <div className="space-y-3">
        {state.layers.map((layer, i) => (
          <div key={i} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
              {t("Layer", "ស្រទាប់")} {i + 1}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Field label="X (px)" labelKm="ផ្ដេក (px)">
                <TextInput inputMode="numeric" value={layer.x} onChange={(e) => updateLayer(i, { x: e.target.value })} className={layerInput} />
              </Field>
              <Field label="Y (px)" labelKm="បញ្ឈរ (px)">
                <TextInput inputMode="numeric" value={layer.y} onChange={(e) => updateLayer(i, { y: e.target.value })} className={layerInput} />
              </Field>
              <Field label="Blur (px)" labelKm="ភាពព្រិល (px)">
                <TextInput inputMode="numeric" value={layer.blur} onChange={(e) => updateLayer(i, { blur: e.target.value })} className={layerInput} />
              </Field>
              <Field label="Color" labelKm="ពណ៌">
                <TextInput value={layer.color} onChange={(e) => updateLayer(i, { color: e.target.value })} className={layerInput} />
              </Field>
              <div className="flex items-end pb-0.5">
                <button
                  type="button"
                  onClick={() => removeLayer(i)}
                  className="w-full rounded-md border border-[var(--ground-line)] px-3 py-2 text-sm text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
                >
                  {t("Remove", "លុប")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" onClick={addLayer} disabled={state.layers.length >= 8}>
        {t("Add layer", "បន្ថែមស្រទាប់")}
      </Button>

      <Output label={t("CSS", "កូដ CSS")} value={`text-shadow: ${css};`} />
    </ToolShell>
  );
}
