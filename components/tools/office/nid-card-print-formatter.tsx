"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Output";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";
import { useToolState } from "@/lib/storage";
import { recordExport, watermarkImageDataUrl } from "@/lib/export";
import {
  Check,
  FileDown,
  FileImage,
  FileText,
  Image as ImageIcon,
  Printer,
  RotateCw,
  ShieldCheck,
  Sliders,
  Upload,
  Wand,
  X,
} from "lucide-react";

const NID_ASPECT_RATIO = 8.5 / 5.4;
const PX_PER_CM = 300 / 2.54;
const CARD_CM_W = 8.5;
const CARD_CM_H = 5.4;

type CropRect = { x: number; y: number; w: number; h: number };
type Side = "front" | "back";
type HandlePos = "tl" | "tr" | "bl" | "br";

interface CardSide {
  image: HTMLImageElement | null;
  hasImage: boolean;
  rotation: number;
  cropRect: CropRect;
  croppedDataUrl: string | null;
  freeCrop: boolean;
}

function emptySide(): CardSide {
  return { image: null, hasImage: false, rotation: 0, cropRect: { x: 0, y: 0, w: 0, h: 0 }, croppedDataUrl: null, freeCrop: false };
}

const initialRect: CropRect = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };

function applySharpen(imgData: ImageData, w: number, h: number): ImageData {
  const weights = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  const side = 3;
  const halfSide = 1;
  const src = imgData.data;
  const output = new ImageData(w, h);
  const dst = output.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dstOff = (y * w + x) * 4;
      let r = 0, g = 0, b = 0;
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = y + cy - halfSide;
          const scx = x + cx - halfSide;
          if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
            const srcOff = (scy * w + scx) * 4;
            const wt = weights[cy * side + cx];
            r += src[srcOff] * wt;
            g += src[srcOff + 1] * wt;
            b += src[srcOff + 2] * wt;
          }
        }
      }
      dst[dstOff] = r;
      dst[dstOff + 1] = g;
      dst[dstOff + 2] = b;
      dst[dstOff + 3] = src[dstOff + 3];
    }
  }
  return output;
}

export default function NidCardPrintFormatter() {
  const { text } = useLanguage();
  const [front, setFront] = useState<CardSide>(emptySide);
  const [back, setBack] = useState<CardSide>(emptySide);
  const [bw, setBw] = useToolState("nid-print:bw", false);
  const [contrast, setContrast] = useToolState("nid-print:contrast", 100);
  const [brightness, setBrightness] = useToolState("nid-print:brightness", 100);
  const [saturation, setSaturation] = useToolState("nid-print:saturation", 100);
  const [sharpen, setSharpen] = useToolState("nid-print:sharpen", false);
  const [watermark, setWatermark] = useToolState("nid-print:watermark", "");
  const [roundCorners, setRoundCorners] = useToolState("nid-print:round", true);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [cardOffset, setCardOffset] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; active: boolean } | null>(null);
  const didDragRef = useRef(false);

  const frontPreviewRef = useRef<HTMLCanvasElement>(null);
  const backPreviewRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const a4WrapperRef = useRef<HTMLDivElement>(null);
  const a4Ref = useRef<HTMLDivElement>(null);

  const setSide = (side: Side, patch: Partial<CardSide>) =>
    side === "front" ? setFront((p) => ({ ...p, ...patch })) : setBack((p) => ({ ...p, ...patch }));

  const onCardPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    didDragRef.current = false;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragStateRef.current = { startX: event.clientX, startY: event.clientY, baseX: cardOffset.x, baseY: cardOffset.y, active: true };
  };

  const onCardPointerMove = (event: React.PointerEvent) => {
    const drag = dragStateRef.current;
    if (!drag?.active) return;
    if (Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) > 6) didDragRef.current = true;
    const a4 = a4Ref.current;
    const scale = a4 ? a4.getBoundingClientRect().width / a4.offsetWidth : 1;
    const nextX = drag.baseX + (event.clientX - drag.startX) / scale;
    const nextY = drag.baseY + (event.clientY - drag.startY) / scale;
    setCardOffset({
      x: Math.min(400, Math.max(-400, nextX)),
      y: Math.min(900, Math.max(-100, nextY)),
    });
  };

  const onCardPointerUp = (event: React.PointerEvent) => {
    if (dragStateRef.current) dragStateRef.current.active = false;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  };

  const drawPreview = (side: Side, state: CardSide) => {
    const previewCanvas = side === "front" ? frontPreviewRef.current : backPreviewRef.current;
    const ctx = previewCanvas?.getContext("2d");
    if (!previewCanvas || !ctx || !state.croppedDataUrl) return;

    const img = new Image();
    img.onload = () => {
      previewCanvas.width = img.width;
      previewCanvas.height = img.height;
      ctx.save();

      // White base so rounded corners render as white (JPEG/DOCX/PDF cannot carry transparency).
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

      if (roundCorners) {
        const radius = Math.min(img.width, img.height) * 0.04;
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(previewCanvas.width - radius, 0);
        ctx.quadraticCurveTo(previewCanvas.width, 0, previewCanvas.width, radius);
        ctx.lineTo(previewCanvas.width, previewCanvas.height - radius);
        ctx.quadraticCurveTo(previewCanvas.width, previewCanvas.height, previewCanvas.width - radius, previewCanvas.height);
        ctx.lineTo(radius, previewCanvas.height);
        ctx.quadraticCurveTo(0, previewCanvas.height, 0, previewCanvas.height - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.clip();
      }

      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)${bw ? " grayscale(100%)" : ""}`;
      ctx.drawImage(img, 0, 0);

      if (sharpen) {
        ctx.filter = "none";
        const imgData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
        ctx.putImageData(applySharpen(imgData, previewCanvas.width, previewCanvas.height), 0, 0);
      }

      if (watermark.trim() !== "") {
        ctx.translate(previewCanvas.width / 2, previewCanvas.height / 2);
        ctx.rotate(-Math.PI / 6);
        ctx.font = `bold ${previewCanvas.width / 9}px sans-serif`;
        ctx.fillStyle = "rgba(100, 100, 100, 0.45)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(watermark, 0, 0);
      }

      ctx.restore();
    };
    img.src = state.croppedDataUrl;
  };

  useEffect(() => {
    drawPreview("front", front);
    drawPreview("back", back);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [front.croppedDataUrl, back.croppedDataUrl, bw, contrast, brightness, saturation, sharpen, watermark, roundCorners]);

  const exportPNG = async () => {
    const frontCv = frontPreviewRef.current;
    const backCv = backPreviewRef.current;
    if (!frontCv?.width && !backCv?.width) return;

    const canvas = document.createElement("canvas");
    canvas.width = 2480;
    canvas.height = 3508;
    const ctx = canvas.getContext("2d");
    ctx!.fillStyle = "white";
    ctx!.fillRect(0, 0, canvas.width, canvas.height);

    const cardW = CARD_CM_W * PX_PER_CM;
    const cardH = CARD_CM_H * PX_PER_CM;
    const gap = 1 * PX_PER_CM;
    const startX = (canvas.width - (cardW * 2 + gap)) / 2;
    const startY = 2 * PX_PER_CM;

    ctx!.strokeStyle = "#000000";
    ctx!.lineWidth = 2;

    if (frontCv?.width) {
      ctx!.drawImage(frontCv, startX, startY, cardW, cardH);
      ctx!.strokeRect(startX, startY, cardW, cardH);
    }
    if (backCv?.width) {
      ctx!.drawImage(backCv, startX + cardW + gap, startY, cardW, cardH);
      ctx!.strokeRect(startX + cardW + gap, startY, cardW, cardH);
    }

    const link = document.createElement("a");
    link.download = "NID_Card_Layout.png";
    link.href = await watermarkImageDataUrl(canvas.toDataURL("image/png"), "image/png");
    link.click();
    recordExport();
  };

  const exportDOCX = async () => {
    const { Document, ImageRun, Packer, Paragraph, TextRun } = await import("docx");
    type ParagraphChild = import("docx").ParagraphChild;
    const frontCv = frontPreviewRef.current;
    const backCv = backPreviewRef.current;

    const getBytes = (canvas: HTMLCanvasElement | null) => {
      if (!canvas?.width) return null;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const base64 = dataUrl.split(",")[1];
      const binary = window.atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    };

    const frontBytes = getBytes(frontCv);
    const backBytes = getBytes(backCv);
    if (!frontBytes && !backBytes) return;

    const cmToPxWord = 37.795;
    const imageOptions = (data: Uint8Array) => ({ data, type: "jpg" as const, transformation: { width: CARD_CM_W * cmToPxWord, height: CARD_CM_H * cmToPxWord } });
    const runs: ParagraphChild[] = [];
    if (frontBytes) {
      runs.push(new ImageRun(imageOptions(frontBytes)));
    }
    if (frontBytes && backBytes) runs.push(new TextRun({ text: "    " }));
    if (backBytes) {
      runs.push(new ImageRun(imageOptions(backBytes)));
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 }, // A4 in twips
              margin: { top: 1134, right: 709, bottom: 1134, left: 709 }, // 2cm top/bottom, 1.25cm sides
            },
          },
          children: [new Paragraph({ children: runs })],
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "NID_Card_Layout.docx";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
    recordExport();
  };

  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const frontCv = frontPreviewRef.current;
    const backCv = backPreviewRef.current;
    const frontHasImage = !!frontCv?.width;
    const backHasImage = !!backCv?.width;
    if (!frontHasImage && !backHasImage) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const cardW = 85;
    const cardH = 54;
    const gap = 10;
    const startY = 20;

    let totalW = 0;
    if (frontHasImage) totalW += cardW;
    if (backHasImage) totalW += cardW;
    if (frontHasImage && backHasImage) totalW += gap;
    let currentX = (210 - totalW) / 2;

    if (frontHasImage) {
      doc.addImage(frontCv!.toDataURL("image/jpeg", 0.95), "JPEG", currentX, startY, cardW, cardH);
      doc.setDrawColor(200, 200, 200);
      doc.rect(currentX, startY, cardW, cardH);
      currentX += cardW + gap;
    }
    if (backHasImage) {
      doc.addImage(backCv!.toDataURL("image/jpeg", 0.95), "JPEG", currentX, startY, cardW, cardH);
      doc.setDrawColor(200, 200, 200);
      doc.rect(currentX, startY, cardW, cardH);
    }
    doc.save("NID_Card_Layout.pdf");
    recordExport();
  };

  const scaleA4 = () => {
    const container = previewContainerRef.current;
    const wrapper = a4WrapperRef.current;
    const a4Elem = a4Ref.current;
    if (!container || !wrapper || !a4Elem) return;
    const availWidth = container.clientWidth - 20;
    const originalWidth = a4Elem.offsetWidth;
    if (availWidth < originalWidth && originalWidth > 0) {
      const scale = availWidth / originalWidth;
      wrapper.style.transform = `scale(${scale})`;
      wrapper.style.transformOrigin = "top center";
      wrapper.style.marginBottom = `${-a4Elem.offsetHeight * (1 - scale)}px`;
    } else {
      wrapper.style.transform = "scale(1)";
      wrapper.style.transformOrigin = "top center";
      wrapper.style.marginBottom = "0px";
    }
  };

  useEffect(() => {
    window.addEventListener("resize", scaleA4);
    setTimeout(scaleA4, 100);
    return () => window.removeEventListener("resize", scaleA4);
  }, []);

  useEffect(() => {
    setTimeout(scaleA4, 400);
  }, [sidebarHidden, front.hasImage, back.hasImage]);

  const hasAny = front.croppedDataUrl !== null || back.croppedDataUrl !== null;

  const panels = [
    { side: "front" as Side, label: text("Front Side", "មុខកាត") },
    { side: "back" as Side, label: text("Back Side", "ខ្នងកាត") },
  ];

  return (
    <ToolShell
      title="NID Card Print Formatter"
      khmerTitle="រៀបចំអត្តសញ្ញាណប័ណ្ណសម្រាប់បោះពុម្ព"
      description="Crop the front and back of a national ID card, clean them up with document-scanner filters, and print or export an A4 layout with both cards at 8.5 × 5.4 cm. Images never leave your browser."
      descriptionKm="រៀបចំរូបភាពមុខ និងខ្នងប័ណ្ណសម្គាល់អត្តសញ្ញាណ សម្អាតជាមួយតម្រងអ្នកស្កេនឯកសារ រួចបោះពុម្ព ឬនាំចេញទំព័រ A4 ដែលមានកាតទាំងពីរទំហំ 8.5 × 5.4 សង់ទីម៉ែត្រ។ រូបភាពមិនចាកចេញពីកម្មវិធីរុករករបស់អ្នកទេ។"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={exportPNG} disabled={!hasAny} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">
          <FileImage size={15} /> {text("PNG", "PNG")}
        </Button>
        <Button type="button" onClick={() => void exportDOCX()} disabled={!hasAny} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">
          <FileText size={15} /> {text("DOCX", "DOCX")}
        </Button>
        <Button type="button" onClick={() => void exportPDF()} disabled={!hasAny} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">
          <FileDown size={15} /> {text("PDF", "PDF")}
        </Button>
        <Button type="button" onClick={() => window.print()} disabled={!hasAny}>
          <Printer size={15} /> {text("Print Layout", "បោះពុម្ព")}
        </Button>
        <button
          type="button"
          className="ml-auto flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:bg-[var(--ground-raised-hi)]"
          onClick={() => setSidebarHidden((v) => !v)}
        >
          <Sliders size={14} /> {text(sidebarHidden ? "Show Tools" : "Hide Tools", sidebarHidden ? "បង្ហាញឧបករណ៍" : "លាក់ឧបករណ៍")}
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Left: editors */}
        <div className={`w-full space-y-4 transition-opacity lg:w-2/5 ${sidebarHidden ? "lg:hidden" : ""}`}>
          {panels.map(({ side, label }) => {
            const state = side === "front" ? front : back;
            return (
              <CropperSection
                key={side}
                side={side}
                label={label}
                state={state}
                setSide={setSide}
                onApply={(newState) => {
                  setSide(side, { croppedDataUrl: newState });
                  const other = side === "front" ? back : front;
                  if (other.croppedDataUrl && newState) setSidebarHidden(true);
                }}
                text={text}
              />
            );
          })}

          {/* Filters */}
          <section className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)]/40 p-4">
            <h2 className="mb-1 flex items-center gap-2 border-b border-[var(--ground-line)] pb-2 text-sm font-semibold text-[var(--ink)]">
              <Sliders size={15} className="text-[var(--gold)]" /> {text("Document Scanner Filters", "តម្រងអ្នកស្កេនឯកសារ")}
            </h2>
            <p className="mb-4 mt-1 text-xs text-[var(--ink-faint)]">{text("Make text pop and clear the background before printing.", "ធ្វើឱ្យអក្សរច្បាស់ និងសម្អាតផ្ទៃខាងក្រោយមុនពេលបោះពុម្ព។")}</p>
            <div className="space-y-5 rounded-md bg-[var(--ground)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--ink)]">{text("Black & White Mode", "របៀបខ្មៅ & ស")}</span>
                <input type="checkbox" checked={bw} onChange={(e) => setBw(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
              </div>
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm font-medium text-[var(--ink)]">{text("Contrast", "កម្រិតផ្ទុយពណ៌")}</span>
                  <span className="rounded bg-[var(--gold)]/10 px-2 py-0.5 text-xs font-bold text-[var(--gold)]">{contrast}%</span>
                </div>
                <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full accent-[var(--gold)]" />
              </div>
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm font-medium text-[var(--ink)]">{text("Brightness", "ពន្លឺ")}</span>
                  <span className="rounded bg-[var(--gold)]/10 px-2 py-0.5 text-xs font-bold text-[var(--gold)]">{brightness}%</span>
                </div>
                <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full accent-[var(--gold)]" />
              </div>
              <div>
                <div className="mb-1 flex justify-between">
                  <span className="text-sm font-medium text-[var(--ink)]">{text("Saturation", "កម្រិតឆ្អែតពណ៌")}</span>
                  <span className="rounded bg-[var(--gold)]/10 px-2 py-0.5 text-xs font-bold text-[var(--gold)]">{saturation}%</span>
                </div>
                <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full accent-[var(--gold)]" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-[var(--ink)]">{text("Sharpen Image", "ធ្វើឱ្យរូបភាពមុត")}</span>
                <input type="checkbox" checked={sharpen} onChange={(e) => setSharpen(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
              </div>
            </div>
          </section>

          {/* Security & styling */}
          <section className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)]/40 p-4">
            <h2 className="mb-1 flex items-center gap-2 border-b border-[var(--ground-line)] pb-2 text-sm font-semibold text-[var(--ink)]">
              <ShieldCheck size={15} className="text-[var(--teal)]" /> {text("Security & Styling", "សន្តិសុខ និងស្ទីល")}
            </h2>
            <div className="mt-3 space-y-4 rounded-md bg-[var(--ground)] p-4">
              <div>
                <span className="mb-1 block text-sm font-medium text-[var(--ink)]">{text("Security Watermark", "សញ្ញាទឹកសន្តិសុខ")}</span>
                <input
                  type="text"
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value)}
                  placeholder={text("e.g. For Bank Use Only", "ឧ. សម្រាប់តែប្រើប្រាស់ក្នុងធនាគារ")}
                  className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--gold-dim)]"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--ink)]">{text("Round ID Corners", "រាងជ្រុងកាតមូល")}</span>
                <input type="checkbox" checked={roundCorners} onChange={(e) => setRoundCorners(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
              </div>
            </div>
          </section>
        </div>

        {/* Right: A4 preview */}
        <div
          ref={previewContainerRef}
          className="w-full cursor-pointer overflow-y-auto rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)]/30 p-2 md:p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:w-3/5 lg:self-start"
          onClick={() => {
            if (!sidebarHidden && !didDragRef.current) setSidebarHidden(true);
          }}
        >
          <div className="print-section">
            <div className="flex justify-center">
              <div ref={a4WrapperRef} className="transition-transform duration-200">
                <div ref={a4Ref} className="a4-preview flex min-h-[29.7cm] w-[21cm] flex-col items-center bg-white px-[2cm] pb-[2cm] pt-8 shadow-[var(--shadow-elev)]">
                  <div
                    className="card-layout-container relative flex w-full flex-row items-center justify-center gap-[1cm] touch-none"
                    style={{ transform: `translate(${cardOffset.x}px, ${cardOffset.y}px)`, cursor: "grab" }}
                    onPointerDown={onCardPointerDown}
                    onPointerMove={onCardPointerMove}
                    onPointerUp={onCardPointerUp}
                    onClick={(event) => event.stopPropagation()}
                    title={text("Drag to reposition the cards", "អូសដើម្បីផ្លាស់ទីកាត")}
                  >
                    {panels.map(({ side, label }) => {
                      const state = side === "front" ? front : back;
                      return (
                        <div key={side} className="flex flex-col items-center">
                          <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 print:hidden">{label}</span>
                          <div
                            className="relative flex h-[5.4cm] w-[8.5cm] items-center justify-center overflow-hidden border border-dashed border-[#c0b8a8] bg-white"
                            style={{ borderRadius: roundCorners ? "0.35cm" : 0 }}
                          >
                            {state.croppedDataUrl ? (
                              <canvas ref={side === "front" ? frontPreviewRef : backPreviewRef} className="absolute inset-0 block h-full w-full" />
                            ) : (
                              <span className="flex flex-col items-center justify-center text-center text-sm font-medium text-gray-400">
                                <ImageIcon size={22} className="mx-auto mb-2 text-gray-300" />
                                {label}
                                <br />
                                {text("Preview", "មើលជាមុន")}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`@media print { body * { visibility: hidden !important; } .print-section, .print-section * { visibility: visible !important; } .print-section { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; } .a4-preview { box-shadow: none !important; margin: 0 !important; padding: 1cm !important; width: 21cm !important; min-height: 29.7cm !important; } .card-layout-container { gap: 0.5cm !important; justify-content: flex-start !important; } }`}</style>
    </ToolShell>
  );
}

function CropperSection({
  side,
  label,
  state,
  setSide,
  onApply,
  text,
}: {
  side: Side;
  label: string;
  state: CardSide;
  setSide: (side: Side, patch: Partial<CardSide>) => void;
  onApply: (croppedDataUrl: string) => void;
  text: (en: string, km: string) => string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);

  // Draw the rotated image into the editor canvas whenever the source changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = state.image;
    if (!canvas || !ctx || !img) return;

    let cw = img.width;
    let ch = img.height;
    if (state.rotation === 90 || state.rotation === 270) {
      cw = img.height;
      ch = img.width;
    }
    canvas.width = cw;
    canvas.height = ch;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((state.rotation * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }, [state.image, state.rotation]);

  // Position the crop overlay relative to the displayed canvas.
  const syncCropBox = () => {
    const canvas = canvasRef.current;
    const cropArea = cropAreaRef.current;
    if (!canvas || !cropArea || !state.hasImage) return;
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = canvas.parentElement!.getBoundingClientRect();
    if (!canvasRect.width || !canvasRect.height) return;
    const offsetX = canvasRect.left - containerRect.left;
    const offsetY = canvasRect.top - containerRect.top;
    cropArea.style.left = `${state.cropRect.x * canvasRect.width + offsetX}px`;
    cropArea.style.top = `${state.cropRect.y * canvasRect.height + offsetY}px`;
    cropArea.style.width = `${state.cropRect.w * canvasRect.width}px`;
    cropArea.style.height = `${state.cropRect.h * canvasRect.height}px`;
  };

  useEffect(() => {
    syncCropBox();
  });

  const initCropBox = () => {
    const canvas = canvasRef.current;
    if (!canvas || !state.hasImage) return;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    if (!displayWidth || !displayHeight) return;
    let cw = displayWidth * 0.8;
    let ch = cw / NID_ASPECT_RATIO;
    if (ch > displayHeight * 0.8) {
      ch = displayHeight * 0.8;
      cw = ch * NID_ASPECT_RATIO;
    }
    setSide(side, {
      cropRect: { x: (displayWidth - cw) / 2 / displayWidth, y: (displayHeight - ch) / 2 / displayHeight, w: cw / displayWidth, h: ch / displayHeight },
    });
  };

  useEffect(() => {
    if (state.hasImage) initCropBox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.image, state.rotation]);

  const handleRotate = () => {
    setSide(side, { rotation: state.rotation + 90 });
  };

  const handleAutoCrop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !state.hasImage) return;

    const w = canvas.width;
    const h = canvas.height;
    if (!w || !h) return;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const threshold = 35;
    let top = 0, bottom = h, left = 0, right = w;

    const getLum = (x: number, y: number) => {
      const i = (y * w + x) * 4;
      return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    };

    const bgLumTop = getLum(Math.floor(w / 2), 5);
    const bgLumBottom = getLum(Math.floor(w / 2), h - 5);
    const bgLumLeft = getLum(5, Math.floor(h / 2));
    const bgLumRight = getLum(w - 5, Math.floor(h / 2));

    for (let y = 10; y < h / 2; y++) { if (Math.abs(getLum(Math.floor(w / 2), y) - bgLumTop) > threshold) { top = y; break; } }
    for (let y = h - 10; y > h / 2; y--) { if (Math.abs(getLum(Math.floor(w / 2), y) - bgLumBottom) > threshold) { bottom = y; break; } }
    for (let x = 10; x < w / 2; x++) { if (Math.abs(getLum(x, Math.floor(h / 2)) - bgLumLeft) > threshold) { left = x; break; } }
    for (let x = w - 10; x > w / 2; x--) { if (Math.abs(getLum(x, Math.floor(h / 2)) - bgLumRight) > threshold) { right = x; break; } }

    if ((right - left) < w * 0.2 || (bottom - top) < h * 0.2) {
      setSide(side, { cropRect: initialRect });
      return;
    }

    const pad = 5;
    left = Math.max(0, left - pad);
    top = Math.max(0, top - pad);
    right = Math.min(w, right + pad);
    bottom = Math.min(h, bottom + pad);

    let rect: CropRect = { x: left / w, y: top / h, w: (right - left) / w, h: (bottom - top) / h };
    if (!state.freeCrop) {
      const currentW = rect.w * w;
      const targetH = currentW / NID_ASPECT_RATIO;
      rect = { ...rect, h: targetH / h };
    }
    setSide(side, { cropRect: rect });
  };

  const handleFinalize = () => {
    const srcCanvas = canvasRef.current;
    if (!srcCanvas || !state.hasImage) return;

    const sx = state.cropRect.x * srcCanvas.width;
    const sy = state.cropRect.y * srcCanvas.height;
    const sw = state.cropRect.w * srcCanvas.width;
    const sh = state.cropRect.h * srcCanvas.height;

    const tempCanvas = document.createElement("canvas");
    const aspect = state.freeCrop ? sw / sh : NID_ASPECT_RATIO;
    tempCanvas.width = 1200;
    tempCanvas.height = Math.round(1200 / aspect);
    const tCtx = tempCanvas.getContext("2d");
    tCtx!.drawImage(srcCanvas, sx, sy, sw, sh, 0, 0, tempCanvas.width, tempCanvas.height);
    onApply(tempCanvas.toDataURL("image/jpeg", 0.95));
  };

  if (!state.hasImage) {
    return (
      <section className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)]/40 p-4">
        <div className="mb-3 flex items-center justify-between border-b border-[var(--ground-line)] pb-2">
          <h2 className="text-sm font-semibold text-[var(--ink)]">{label}</h2>
        </div>
        <label className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[var(--gold-dim)]/40 bg-[var(--ground-raised)]/50 px-4 py-8 text-center transition hover:border-[var(--gold)]">
          <Upload className="text-[var(--gold)]" size={26} />
          <span className="text-xs font-medium text-[var(--ink-dim)]">{text("Tap to upload image", "ចុចដើម្បីផ្ទុករូបភាព")}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readImageFromFile(file, setSide, side);
            }}
          />
        </label>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)]/40 p-4">
      <div className="mb-3 flex items-center justify-between border-b border-[var(--ground-line)] pb-2">
        <h2 className="text-sm font-semibold text-[var(--ink)]">{label}</h2>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2.5 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)]"
          onClick={() => setSide(side, { hasImage: false, image: null, croppedDataUrl: null })}
        >
          <X size={13} /> {text("Remove", "លុបចេញ")}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="flex items-center gap-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2.5 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)]" onClick={handleAutoCrop}>
            <Wand size={14} className="text-[var(--gold)]" /> {text("Auto Detect", "រកដោយស្វ័យប្រវត្តិ")}
          </button>
          <button type="button" className="flex items-center gap-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2.5 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)]" onClick={handleRotate}>
            <RotateCw size={14} /> {text("Rotate", "បង្វិល")}
          </button>
          <label className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2.5 py-1.5 text-xs text-[var(--ink-dim)]">
            <input type="checkbox" checked={state.freeCrop} onChange={(e) => setSide(side, { freeCrop: e.target.checked })} className="h-3.5 w-3.5 accent-[var(--gold)]" />
            {text("Free Crop", "កាត់ដោយសេរី")}
          </label>
        </div>

        <div className="cropper-container relative h-56 w-full touch-none overflow-hidden rounded-md border border-[var(--ground-line)] select-none md:h-64">
          <canvas ref={canvasRef} className="absolute inset-0 m-auto block max-h-full max-w-full" />
          <div
            ref={cropAreaRef}
            className="absolute z-10 border-2 border-dashed border-[var(--teal)] shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
            style={{ cursor: "move", display: state.hasImage ? "block" : "none" }}
          >
            <CropHandle side={side} position="tl" state={state} setSide={setSide} />
            <CropHandle side={side} position="tr" state={state} setSide={setSide} />
            <CropHandle side={side} position="bl" state={state} setSide={setSide} />
            <CropHandle side={side} position="br" state={state} setSide={setSide} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={handleFinalize} className="w-full sm:w-auto">
            <Check size={15} /> {text("Apply & Continue", "អនុវត្ត & បន្ត")}
          </Button>
        </div>
      </div>
    </section>
  );
}

function readImageFromFile(file: File, setSide: (side: Side, patch: Partial<CardSide>) => void, side: Side) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      setSide(side, { image: img, hasImage: true, rotation: 0, cropRect: initialRect, croppedDataUrl: null });
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
}

function CropHandle({
  side,
  position,
  state,
  setSide,
}: {
  side: Side;
  position: HandlePos;
  state: CardSide;
  setSide: (side: Side, patch: Partial<CardSide>) => void;
}) {
  const cursor = position === "tl" || position === "br" ? "nwse-resize" : "nesw-resize";
  const style: React.CSSProperties = {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 9999,
    backgroundColor: "#fff",
    border: "2px solid var(--teal)",
    zIndex: 20,
    cursor,
  };
  if (position.includes("t")) style.top = -8;
  if (position.includes("b")) style.bottom = -8;
  if (position.includes("l")) style.left = -8;
  if (position.includes("r")) style.right = -8;

  const onPointerDown = (event: React.PointerEvent) => {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const el = event.currentTarget as HTMLElement;
    if (!el.hasPointerCapture(event.pointerId)) return;
    const cropArea = el.parentElement as HTMLElement;
    const container = cropArea.parentElement as HTMLElement;
    const canvas = container.querySelector("canvas");
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const offsetX = canvasRect.left - containerRect.left;
    const offsetY = canvasRect.top - containerRect.top;

    const dx = event.movementX / canvasRect.width;
    const dy = event.movementY / canvasRect.height;

    const rect = { ...state.cropRect };

    if (state.freeCrop) {
      if (position === "br") { rect.w += dx; rect.h += dy; }
      else if (position === "tl") { rect.x += dx; rect.y += dy; rect.w -= dx; rect.h -= dy; }
      else if (position === "tr") { rect.w += dx; rect.y += dy; rect.h -= dy; }
      else { rect.x += dx; rect.w -= dx; rect.h += dy; }
    } else {
      const moveX = dx;
      const moveY = dx / NID_ASPECT_RATIO;
      if (position === "br") { rect.w += moveX; rect.h += moveY; }
      else if (position === "tl") { rect.x += moveX; rect.y += moveY; rect.w -= moveX; rect.h -= moveY; }
      else if (position === "tr") { rect.w += moveX; rect.y -= moveY; rect.h += moveY; }
      else { rect.x += moveX; rect.w -= moveX; rect.h -= moveY; }
    }

    const minW = 40 / canvasRect.width;
    if (rect.w < minW) { rect.w = minW; if (!state.freeCrop) rect.h = minW / NID_ASPECT_RATIO; }
    if (rect.h < 40 / canvasRect.height && state.freeCrop) rect.h = 40 / canvasRect.height;

    if (rect.x < 0) rect.x = 0;
    if (rect.y < 0) rect.y = 0;
    if (rect.x + rect.w > 1) rect.w = 1 - rect.x;
    if (rect.y + rect.h > 1) rect.h = 1 - rect.y;

    void offsetX;
    void offsetY;
    setSide(side, { cropRect: rect });
  };

  const onPointerUp = (event: React.PointerEvent) => {
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  };

  return <div style={style} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />;
}
