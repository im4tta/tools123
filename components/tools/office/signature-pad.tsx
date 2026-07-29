"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import DrawingCanvas, { type DrawingCanvasHandle } from "@/components/ui/DrawingCanvas";
import { Button } from "@/components/ui/Output";
import { Field, Select, TextInput, ToolShell } from "@/components/ui/Shell";

type Background = "transparent" | "white";

export default function SignaturePad() {
  const { text } = useLanguage();
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [color, setColor] = useState("#111827");
  const [lineWidth, setLineWidth] = useState("3");
  const [background, setBackground] = useState<Background>("transparent");

  return (
    <ToolShell
      title="Signature Pad"
      khmerTitle="ផ្ទាំងហត្ថលេខា"
      description="Draw a signature with a mouse, pen, or touch and download a transparent or white PNG. Nothing is uploaded or saved."
      descriptionKm="គូរហត្ថលេខាដោយកណ្ដុរ ប៊ិច ឬការប៉ះ ហើយទាញយក PNG ផ្ទៃថ្លា ឬស។ មិនមានអ្វីត្រូវបានផ្ទុកឡើង ឬរក្សាទុកទេ។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Ink color" labelKm="ពណ៌ទឹកប៊ិច">
          <TextInput
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-10 cursor-pointer p-1"
          />
        </Field>
        <Field label="Line width" labelKm="កម្រាស់បន្ទាត់" hint={`${lineWidth}px`}>
          <TextInput
            type="range"
            min="1"
            max="12"
            value={lineWidth}
            onChange={(event) => setLineWidth(event.target.value)}
            className="h-10 cursor-pointer px-1"
          />
        </Field>
        <Field label="PNG background" labelKm="ផ្ទៃខាងក្រោយ PNG">
          <Select value={background} onChange={(event) => setBackground(event.target.value as Background)}>
            <option value="transparent">{text("Transparent", "ថ្លា")}</option>
            <option value="white">{text("White", "ពណ៌ស")}</option>
          </Select>
        </Field>
      </div>

      <DrawingCanvas
        ref={canvasRef}
        color={color}
        strokeWidth={Number(lineWidth)}
        background={background === "white" ? "#ffffff" : "transparent"}
        emptyLabel={text("Sign here", "ចុះហត្ថលេខានៅទីនេះ")}
        ariaLabel={text("Signature drawing area", "តំបន់គូរហត្ថលេខា")}
        onChange={setHasStrokes}
        className="rounded-md border-2 border-dashed border-[var(--ground-line)] bg-white shadow-inner"
        canvasClassName="h-64 sm:h-80"
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!hasStrokes}
          onClick={() => canvasRef.current?.undo()}
          className="!bg-[var(--ground-raised)] !text-[var(--ink)]"
        >
          {text("Undo", "មិនធ្វើវិញ")}
        </Button>
        <Button
          type="button"
          disabled={!hasStrokes}
          onClick={() => canvasRef.current?.clear()}
          className="!bg-[var(--ground-raised)] !text-[var(--danger)]"
        >
          {text("Clear", "សម្អាត")}
        </Button>
        <Button
          type="button"
          disabled={!hasStrokes}
          onClick={() => canvasRef.current?.exportPng(`signature-${background}.png`)}
        >
          {text("Download PNG", "ទាញយក PNG")}
        </Button>
      </div>
      <p className="text-xs text-[var(--ink-faint)]">
        {text(
          "The canvas preserves completed strokes when its size changes. Undo removes one stroke at a time.",
          "ផ្ទាំងគំនូររក្សាបន្ទាត់ដែលបានគូររួច នៅពេលទំហំផ្លាស់ប្តូរ។ មិនធ្វើវិញនឹងលុបមួយបន្ទាត់ម្ដង។",
        )}
      </p>
    </ToolShell>
  );
}
