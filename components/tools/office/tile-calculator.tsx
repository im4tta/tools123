"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const PRESETS = [
  { l: 60, w: 60, label: "60×60" },
  { l: 80, w: 80, label: "80×80" },
  { l: 30, w: 60, label: "30×60" },
];

function toNum(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function TileCalculator() {
  const { text: t } = useLanguage();
  const [length, setLength] = useToolState("tile:length", "4");
  const [width, setWidth] = useToolState("tile:width", "3");
  const [tileL, setTileL] = useToolState("tile:tileL", "60");
  const [tileW, setTileW] = useToolState("tile:tileW", "60");
  const [joint, setJoint] = useToolState("tile:joint", "0");
  const [waste, setWaste] = useToolState("tile:waste", "10");
  const [perBox, setPerBox] = useToolState("tile:perBox", "4");

  const result = useMemo(() => {
    const l = Math.max(0, toNum(length));
    const w = Math.max(0, toNum(width));
    const tl = Math.max(0.1, toNum(tileL)) / 100;
    const tw = Math.max(0.1, toNum(tileW)) / 100;
    const j = Math.max(0, toNum(joint)) / 1000;
    const wastePct = Math.max(0, toNum(waste)) / 100;
    const area = l * w;
    const tileArea = tl * tw;
    const effectiveArea = (tl + j) * (tw + j);
    const tiles = Math.ceil((area / effectiveArea) * (1 + wastePct));
    const perBoxCount = Math.max(1, Math.round(toNum(perBox)) || 1);
    const boxes = Math.ceil(tiles / perBoxCount);
    return {
      area,
      tileArea,
      tiles,
      boxes,
      perBoxCount,
      purchasedArea: boxes * perBoxCount * tileArea,
      wastePct,
    };
  }, [length, width, tileL, tileW, joint, waste, perBox]);

  return (
    <ToolShell
      title="Tile Calculator"
      khmerTitle="គណនាក្បឿង"
      description="Estimate the number of tiles and boxes needed for a floor or wall from the area, tile size (cm), optional joint width and wastage."
      descriptionKm="ប៉ាន់ស្មានចំនួនក្បឿង និងប្រអប់ដែលត្រូវការសម្រាប់កម្រាល ឬជញ្ជាំង ពីផ្ទៃដី ទំហំក្បឿង (ស.ម) ទទឹងសន្លាក់ជាជម្រើស និងការខូចខាត។"
    >
      <Row>
        <Field label={t("Floor / wall length (m)", "ប្រវែងកម្រាល / ជញ្ជាំង (ម)")}>
          <TextInput type="number" min="0" step="any" value={length} onChange={(e) => setLength(e.target.value)} />
        </Field>
        <Field label={t("Floor / wall width (m)", "ទទឹងកម្រាល / ជញ្ជាំង (ម)")}>
          <TextInput type="number" min="0" step="any" value={width} onChange={(e) => setWidth(e.target.value)} />
        </Field>
      </Row>

      <div className="rounded-md border border-[var(--ground-line)] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium text-[var(--ink)]">{t("Tile size", "ទំហំក្បឿង")}</h2>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setTileL(String(p.l));
                  setTileW(String(p.w));
                }}
                className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2.5 py-1 text-xs font-semibold text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)] hover:text-[var(--ink)]"
              >
                {p.label} cm
              </button>
            ))}
          </div>
        </div>
        <Row>
          <Field label={t("Tile length (cm)", "ប្រវែងក្បឿង (ស.ម)")}>
            <TextInput type="number" min="1" step="any" value={tileL} onChange={(e) => setTileL(e.target.value)} />
          </Field>
          <Field label={t("Tile width (cm)", "ទទឹងក្បឿង (ស.ម)")}>
            <TextInput type="number" min="1" step="any" value={tileW} onChange={(e) => setTileW(e.target.value)} />
          </Field>
        </Row>
      </div>

      <Row>
        <Field label={t("Joint width (mm, optional)", "ទទឹងសន្លាក់ (ម.ម, ជាជម្រើស)")}>
          <TextInput type="number" min="0" step="any" value={joint} onChange={(e) => setJoint(e.target.value)} />
        </Field>
        <Field label={t("Wastage (%)", "ការខូចខាត (%)")}>
          <TextInput type="number" min="0" step="any" value={waste} onChange={(e) => setWaste(e.target.value)} />
        </Field>
        <Field label={t("Tiles per box", "ចំនួនក្បឿងក្នុងមួយប្រអប់")}>
          <TextInput type="number" min="1" step="1" value={perBox} onChange={(e) => setPerBox(e.target.value)} />
        </Field>
      </Row>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Area", "ផ្ទៃដី")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{result.area.toFixed(2)} m²</div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Tiles needed", "ក្បឿងដែលត្រូវការ")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--gold)]">{result.tiles}</div>
          <div className="text-xs text-[var(--ink-dim)]">{t("incl. wastage", "រាប់បញ្ចូលការខូច")} {Math.round(result.wastePct * 100)}%</div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Boxes needed", "ប្រអប់ដែលត្រូវការ")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{result.boxes}</div>
          <div className="text-xs text-[var(--ink-dim)]">{result.boxes * result.perBoxCount} {t("tiles", "ក្បឿង")}</div>
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Purchased area", "ផ្ទៃដីទិញ")}</div>
          <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{result.purchasedArea.toFixed(2)} m²</div>
          <div className="text-xs text-[var(--ink-dim)]">{t("tile area", "ផ្ទៃក្បឿង")} {result.tileArea.toFixed(4)} m²</div>
        </div>
      </div>
      <p className="text-xs text-[var(--ink-dim)]">
        {t(
          "Joints reduce the number of tiles slightly (each tile covers its size plus the joint). Wastage default 10% covers cutting and breakage.",
          "សន្លាក់បន្ថយចំនួនក្បឿងបន្តិច (ក្បឿងនីមួយៗគ្របដណ្ដប់ទំហំរបស់វាបូកសន្លាក់)។ ការខូចខាតលំនាំដើម ១០% សម្រាប់ការកាត់ និងបាក់បែក។"
        )}
      </p>
    </ToolShell>
  );
}
