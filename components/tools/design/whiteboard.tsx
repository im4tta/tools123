"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import DrawingCanvas, { type DrawingCanvasHandle } from "@/components/ui/DrawingCanvas";
import { Button } from "@/components/ui/Output";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";

export default function Whiteboard() {
  const { text } = useLanguage();
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [color, setColor] = useState("#111827");
  const [lineWidth, setLineWidth] = useState("4");

  return (
    <ToolShell
      title="Whiteboard"
      khmerTitle="ផ្ទាំងគំនូរ"
      description="Sketch freely in your browser and export your work as a PNG. Everything stays on this device; nothing is uploaded."
      descriptionKm="គូរដោយសេរីក្នុងកម្មវិធីរុករករបស់អ្នក ហើយនាំចេញជា PNG។ អ្វីៗទាំងអស់ស្ថិតនៅលើឧបករណ៍នេះ ហើយមិនមានអ្វីត្រូវបានផ្ទុកឡើងទេ។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            max="24"
            value={lineWidth}
            onChange={(event) => setLineWidth(event.target.value)}
            className="h-10 cursor-pointer px-1"
          />
        </Field>
      </div>

      <DrawingCanvas
        ref={canvasRef}
        color={color}
        strokeWidth={Number(lineWidth)}
        background="#ffffff"
        emptyLabel={text("Start drawing", "ចាប់ផ្ដើមគូរ")}
        ariaLabel={text("Whiteboard drawing area", "តំបន់ផ្ទាំងគំនូរ")}
        onChange={setHasStrokes}
        className="rounded-md border border-[var(--ground-line)] bg-white shadow-inner"
        canvasClassName="h-[28rem] sm:h-[36rem]"
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
          onClick={() => canvasRef.current?.exportPng("whiteboard.png")}
        >
          {text("Download PNG", "ទាញយក PNG")}
        </Button>
      </div>

      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs text-[var(--ink-dim)]">
        {text(
          "Local only: your drawing stays in this browser and is never uploaded.",
          "ប្រើតែក្នុងឧបករណ៍នេះ៖ គំនូររបស់អ្នកស្ថិតនៅក្នុងកម្មវិធីរុករកនេះ ហើយមិនត្រូវបានផ្ទុកឡើងទេ។",
        )}
      </p>
    </ToolShell>
  );
}
