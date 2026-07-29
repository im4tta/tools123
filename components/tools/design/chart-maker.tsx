"use client";

import { useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Row, Select, TextArea, ToolShell } from "@/components/ui/Shell";
import { Button, Output } from "@/components/ui/Output";

type ChartType = "bar" | "line";
type Parsed = { labels: string[]; values: number[]; error: string };

const WIDTH = 900;
const HEIGHT = 500;
const LEFT = 70;
const RIGHT = 30;
const TOP = 35;
const BOTTOM = 85;

function parseData(labelInput: string, valueInput: string, errorText: (key: string) => string): Parsed {
  const labels = labelInput.split(/[\n,]/).map((item) => item.trim());
  const valueParts = valueInput.trim().split(/[\s,]+/).filter(Boolean);
  const values = valueParts.map(Number);

  if (!labelInput.trim() || !valueInput.trim()) return { labels: [], values: [], error: errorText("required") };
  if (labels.some((label) => !label)) return { labels: [], values: [], error: errorText("emptyLabel") };
  if (values.some((value) => !Number.isFinite(value))) return { labels: [], values: [], error: errorText("numeric") };
  if (labels.length !== values.length) return { labels: [], values: [], error: errorText("count") };
  if (labels.length > 20) return { labels: [], values: [], error: errorText("limit") };
  return { labels, values, error: "" };
}

function saveSvg(svg: SVGSVGElement) {
  const source = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "chart.svg";
  link.click();
  URL.revokeObjectURL(url);
}

function short(value: string) {
  return value.length > 12 ? `${value.slice(0, 11)}…` : value;
}
export default function ChartMaker() {
  const { text: t } = useLanguage();
  const [type, setType] = useState<ChartType>("bar");
  const [labelInput, setLabelInput] = useState("January, February, March, April");
  const [valueInput, setValueInput] = useState("12, 19, 8, 24");
  const svgRef = useRef<SVGSVGElement>(null);

  const errorText = (key: string) => ({
    required: t("Enter at least one label and value.", "បញ្ចូលស្លាក និងតម្លៃយ៉ាងហោចណាស់មួយ។"),
    emptyLabel: t("Labels cannot be empty.", "ស្លាកមិនអាចទទេបានទេ។"),
    numeric: t("Every value must be a valid number.", "តម្លៃនីមួយៗត្រូវតែជាលេខត្រឹមត្រូវ។"),
    count: t("The number of labels and values must match.", "ចំនួនស្លាក និងតម្លៃត្រូវតែស្មើគ្នា។"),
    limit: t("Use no more than 20 data points.", "ប្រើទិន្នន័យមិនលើសពី ២០ ចំណុច។"),
  })[key] ?? "";

  const parsed = useMemo(
    () => parseData(labelInput, valueInput, errorText),
    // Language changes must also update validation copy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelInput, valueInput, t],
  );

  const plotWidth = WIDTH - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const minimum = parsed.values.length ? Math.min(0, ...parsed.values) : 0;
  const rawMaximum = parsed.values.length ? Math.max(0, ...parsed.values) : 1;
  const maximum = rawMaximum === minimum ? minimum + 1 : rawMaximum;
  const range = maximum - minimum;
  const y = (value: number) => TOP + ((maximum - value) / range) * plotHeight;
  const baseline = y(0);
  const slot = parsed.labels.length ? plotWidth / parsed.labels.length : plotWidth;
  const linePoints = parsed.values.map((value, index) => {
    const x = parsed.values.length === 1 ? LEFT + plotWidth / 2 : LEFT + (index / (parsed.values.length - 1)) * plotWidth;
    return `${x},${y(value)}`;
  }).join(" ");

  return (
    <ToolShell
      title="Chart Maker"
      khmerTitle="កម្មវិធីបង្កើតក្រាហ្វ"
      description="Turn labels and numeric values into a responsive bar or line chart, then download it locally as SVG."
      descriptionKm="បម្លែងស្លាក និងតម្លៃលេខទៅជាក្រាហ្វបារ ឬបន្ទាត់ ហើយទាញយកជា SVG នៅលើឧបករណ៍របស់អ្នក។"
    >
      <Row>
        <Field label="Chart type" labelKm="ប្រភេទក្រាហ្វ">
          <Select value={type} onChange={(event) => setType(event.target.value as ChartType)}>
            <option value="bar">{t("Bar", "បារ")}</option>
            <option value="line">{t("Line", "បន្ទាត់")}</option>
          </Select>
        </Field>
        <Field label="Labels" labelKm="ស្លាក" hint="Comma or new line" hintKm="សញ្ញាក្បៀស ឬបន្ទាត់ថ្មី">
          <TextArea rows={3} value={labelInput} onChange={(event) => setLabelInput(event.target.value)} />
        </Field>
      </Row>
      <Field label="Numeric values" labelKm="តម្លៃលេខ" hint="Comma or space separated" hintKm="បំបែកដោយក្បៀស ឬដកឃ្លា">
        <TextArea rows={3} value={valueInput} onChange={(event) => setValueInput(event.target.value)} />
      </Field>

      {parsed.error ? (
        <Output label={t("Validation", "ការផ្ទៀងផ្ទាត់")} value={parsed.error} error />
      ) : (
        <div>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
            {t("Preview", "មើលជាមុន")}
          </div>
          <svg
            ref={svgRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={t("Chart preview", "ការមើលក្រាហ្វជាមុន")}
            className="h-auto w-full rounded-md border border-[var(--ground-line)]"
          >
            <rect width={WIDTH} height={HEIGHT} fill="#171a1d" />
            {Array.from({ length: 6 }, (_, index) => {
              const value = minimum + (range * index) / 5;
              const tickY = y(value);
              const label = Number(value.toFixed(2)).toString();
              return (
                <g key={index}>
                  <line x1={LEFT} y1={tickY} x2={WIDTH - RIGHT} y2={tickY} stroke="#3a3f43" strokeWidth="1" />
                  <text x={LEFT - 12} y={tickY + 5} textAnchor="end" fill="#a8adb2" fontSize="14" fontFamily="Arial, sans-serif">{label}</text>
                </g>
              );
            })}
            <line x1={LEFT} y1={TOP} x2={LEFT} y2={HEIGHT - BOTTOM} stroke="#848a90" strokeWidth="2" />
            <line x1={LEFT} y1={baseline} x2={WIDTH - RIGHT} y2={baseline} stroke="#848a90" strokeWidth="2" />

            {type === "bar" && parsed.values.map((value, index) => {
              const valueY = y(value);
              return (
                <rect
                  key={`${parsed.labels[index]}-${index}`}
                  x={LEFT + index * slot + slot * 0.18}
                  y={Math.min(valueY, baseline)}
                  width={slot * 0.64}
                  height={Math.max(1, Math.abs(valueY - baseline))}
                  rx="4"
                  fill="#c9a24b"
                />
              );
            })}

            {type === "line" && (
              <g>
                <polyline points={linePoints} fill="none" stroke="#c9a24b" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
                {parsed.values.map((value, index) => {
                  const x = parsed.values.length === 1 ? LEFT + plotWidth / 2 : LEFT + (index / (parsed.values.length - 1)) * plotWidth;
                  return <circle key={index} cx={x} cy={y(value)} r="7" fill="#171a1d" stroke="#c9a24b" strokeWidth="4" />;
                })}
              </g>
            )}
            {parsed.labels.map((label, index) => {
              const x = type === "bar"
                ? LEFT + index * slot + slot / 2
                : parsed.labels.length === 1
                  ? LEFT + plotWidth / 2
                  : LEFT + (index / (parsed.labels.length - 1)) * plotWidth;
              return (
                <text
                  key={`${label}-${index}`}
                  x={x}
                  y={HEIGHT - BOTTOM + 32}
                  textAnchor="middle"
                  fill="#d9dcdf"
                  fontSize="14"
                  fontFamily="Arial, 'Noto Sans Khmer', sans-serif"
                >
                  {short(label)}
                </text>
              );
            })}
          </svg>
        </div>
      )}

      <Button
        className="w-full"
        disabled={Boolean(parsed.error)}
        onClick={() => svgRef.current && saveSvg(svgRef.current)}
      >
        {t("Download SVG", "ទាញយក SVG")}
      </Button>
    </ToolShell>
  );
}
