"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const NAMED_COLORS: Record<string, string> = {
  black: "#000000", white: "#ffffff", gray: "#808080", silver: "#c0c0c0",
  red: "#ff0000", maroon: "#800000", orange: "#ffa500", gold: "#ffd700",
  yellow: "#ffff00", olive: "#808000", lime: "#00ff00", green: "#008000",
  teal: "#008080", cyan: "#00ffff", aqua: "#00ffff", blue: "#0000ff",
  navy: "#000080", purple: "#800080", magenta: "#ff00ff", pink: "#ffc0cb",
  hotpink: "#ff69b4", crimson: "#dc143c", tomato: "#ff6347", coral: "#ff7f50",
  salmon: "#fa8072", chocolate: "#d2691e", sienna: "#a0522d", brown: "#a52a2a",
  tan: "#d2b48c", beige: "#f5f5dc", khaki: "#f0e68c", indigo: "#4b0082",
  violet: "#ee82ee", orchid: "#da70d6", plum: "#dda0dd", lavender: "#e6e6fa",
  skyblue: "#87ceeb", steelblue: "#4682b4", turquoise: "#40e0d0", teal2: "#20b2aa",
  seagreen: "#2e8b57", forestgreen: "#228b22", darkgreen: "#006400", olivedrab: "#6b8e23",
  yellowgreen: "#9acd32", ivory: "#fffff0", cream: "#fffdd0", peachpuff: "#ffdab9",
  slategray: "#708090", dimgray: "#696969", gainsboro: "#dcdcdc", lightgray: "#d3d3d3",
  charcoal: "#36454f", jet: "#343434",
};

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().replace(/^#/, "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export default function ColorNameFinderTool() {
  const [hex, setHex] = useToolState("color-name-finder", "#3b7ea1");

  const { nearest, distance, rgb } = useMemo(() => {
    const target = hexToRgb(hex);
    if (!target) return { nearest: null, distance: 0, rgb: null };
    let best = "";
    let bestDist = Infinity;
    for (const [name, value] of Object.entries(NAMED_COLORS)) {
      const c = hexToRgb(value)!;
      const d = (c[0] - target[0]) ** 2 + (c[1] - target[1]) ** 2 + (c[2] - target[2]) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = name.replace(/\d+$/, "");
      }
    }
    return { nearest: best, distance: Math.sqrt(bestDist), rgb: target };
  }, [hex]);

  return (
    <ToolShell
      title="Nearest CSS Color Name Finder"
      description="Enter a hex color and find the closest matching CSS named color by Euclidean RGB distance."
    >
      <Field label="Hex color">
        <div className="flex items-center gap-3">
          <TextInput value={hex} onChange={(e) => setHex(e.target.value)} className="w-40" />
          {rgb && (
            <span
              className="h-9 w-9 shrink-0 rounded-md border border-[var(--ground-line)]"
              style={{ background: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` }}
            />
          )}
        </div>
      </Field>
      <Output
        label="Nearest match"
        mono={false}
        error={!nearest}
        value={nearest ? `${nearest} (distance ${distance.toFixed(1)})` : "Enter a valid hex color, e.g. #3b7ea1"}
      />
    </ToolShell>
  );
}
