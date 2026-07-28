"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const SAMPLE = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
  <path
      android:fillColor="#1D9E75"
      android:pathData="M12,2 L15,8.5 L22,9.3 L17,14.1 L18.2,21 L12,17.6 L5.8,21 L7,14.1 L2,9.3 L9,8.5 Z"/>
</vector>`;

function attr(el: Element, name: string): string | null {
  return el.getAttribute(`android:${name}`) ?? el.getAttribute(name);
}

function numAttr(el: Element, name: string, fallback = 0): number {
  const v = attr(el, name);
  const n = v ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function groupTransform(el: Element): string {
  const tx = numAttr(el, "translateX");
  const ty = numAttr(el, "translateY");
  const sx = numAttr(el, "scaleX", 1);
  const sy = numAttr(el, "scaleY", 1);
  const rot = numAttr(el, "rotation");
  const px = numAttr(el, "pivotX");
  const py = numAttr(el, "pivotY");
  const parts: string[] = [];
  if (tx || ty) parts.push(`translate(${tx} ${ty})`);
  if (rot) parts.push(`rotate(${rot} ${px} ${py})`);
  if (sx !== 1 || sy !== 1) parts.push(`scale(${sx} ${sy})`);
  return parts.join(" ");
}

function walk(el: Element, indent: string): string {
  const lines: string[] = [];
  for (const child of Array.from(el.children)) {
    const tag = child.tagName.toLowerCase();
    if (tag === "path") {
      const d = attr(child, "pathData") ?? "";
      const fill = attr(child, "fillColor");
      const stroke = attr(child, "strokeColor");
      const strokeWidth = attr(child, "strokeWidth");
      const fillAlpha = attr(child, "fillAlpha");
      const strokeAlpha = attr(child, "strokeAlpha");
      const parts = [`d="${d}"`];
      parts.push(`fill="${fill ?? "none"}"`);
      if (fillAlpha) parts.push(`fill-opacity="${fillAlpha}"`);
      if (stroke) parts.push(`stroke="${stroke}"`);
      if (strokeWidth) parts.push(`stroke-width="${strokeWidth}"`);
      if (strokeAlpha) parts.push(`stroke-opacity="${strokeAlpha}"`);
      lines.push(`${indent}<path ${parts.join(" ")}/>`);
    } else if (tag === "group") {
      const transform = groupTransform(child);
      lines.push(`${indent}<g${transform ? ` transform="${transform}"` : ""}>`);
      lines.push(walk(child, indent + "  "));
      lines.push(`${indent}</g>`);
    }
    // <clip-path> and other exotic nodes are intentionally skipped —
    // they're rare in hand-authored icons and add complexity for little benefit.
  }
  return lines.filter(Boolean).join("\n");
}

export default function VectorDrawableToSvg() {
  const [xml, setXml] = useToolState("vector-drawable-to-svg:xml", SAMPLE);

  const { svg, error } = useMemo(() => {
    try {
      const doc = new DOMParser().parseFromString(xml, "application/xml");
      if (doc.querySelector("parsererror")) return { svg: "", error: "Malformed XML" };
      const root = doc.documentElement;
      if (root.tagName.toLowerCase() !== "vector") {
        return { svg: "", error: "Root element must be <vector> (an Android VectorDrawable)" };
      }
      const vw = numAttr(root, "viewportWidth", 24);
      const vh = numAttr(root, "viewportHeight", 24);
      const width = attr(root, "width") ?? `${vw}`;
      const height = attr(root, "height") ?? `${vh}`;
      const vb = `0 0 ${vw} ${vh}`;
      const body = walk(root, "  ");
      const out = `<svg xmlns="http://www.w3.org/2000/svg" width="${width.replace("dp", "")}" height="${height.replace(
        "dp",
        ""
      )}" viewBox="${vb}">\n${body}\n</svg>`;
      return { svg: out, error: body ? "" : "No <path> elements found" };
    } catch {
      return { svg: "", error: "Could not parse" };
    }
  }, [xml]);

  return (
    <ToolShell
      title="VectorDrawable → SVG"
      description="Paste an Android VectorDrawable XML resource and convert it to a plain SVG — handles nested <group> transforms (translate/rotate/scale) and multiple <path> elements. Runs entirely in your browser."
    >
      <Field label="VectorDrawable XML"><TextArea rows={10} value={xml} onChange={(e) => setXml(e.target.value)} className="font-mono-ui" /></Field>
      {svg && !error && (
        <Field label="Preview">
          <div
            className="flex items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6"
            style={{ backgroundImage: "conic-gradient(#8884 0 25%, #0000 0 50%, #8884 0 75%, #0000 0)", backgroundSize: "16px 16px" }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </Field>
      )}
      <Output label={error || "SVG output"} value={svg} error={!!error} />
    </ToolShell>
  );
}
