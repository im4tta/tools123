"use client";

import { ChangeEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { Download, Eraser, HelpCircle, ImagePlus, Redo2, Scissors, Sparkles, Undo2, WandSparkles } from "lucide-react";
import JSZip from "jszip";
import { Button } from "@/components/ui/Output";
import { Field, Row, Select, TextInput, ToolShell } from "@/components/ui/Shell";

type Quality = "isnet_fp16" | "isnet" | "isnet_quint8";
type EditMode = "pan" | "wand" | "erase" | "restore";
type ExportFormat = "png" | "webp";
type Crop = { aspect: string; customW: number; customH: number; zoom: number; offsetX: number; offsetY: number; brightness: number; contrast: number; saturation: number };
type StickerItem = { id: string; name: string; file: File; originalUrl: string; resultUrl?: string; editUrl?: string; history: string[]; crop: Crop };

const DEFAULT_CROP: Crop = { aspect: "1:1", customW: 1, customH: 1, zoom: 1, offsetX: 0, offsetY: 0, brightness: 100, contrast: 100, saturation: 100 };
const ASPECTS = ["Original", "1:1", "4:5", "5:4", "3:4", "4:3", "9:16", "16:9", "2:3", "Custom"];
const imageUrl = (item: StickerItem) => item.editUrl ?? item.resultUrl ?? item.originalUrl;

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, format: ExportFormat, quality = 0.92) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Canvas export failed")), `image/${format}`, quality));
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function safeName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9\u1780-\u17ff_-]+/g, "-").replace(/^-+|-+$/g, "") || "sticker";
}

function outputRatio(item: StickerItem, image: HTMLImageElement) {
  if (item.crop.aspect === "Original") return image.naturalWidth / image.naturalHeight;
  if (item.crop.aspect === "Custom") return Math.max(0.01, item.crop.customW) / Math.max(0.01, item.crop.customH);
  const [width, height] = item.crop.aspect.split(":").map(Number);
  return width / height;
}

function dimensionsForRatio(ratio: number) {
  return ratio >= 1 ? { width: 512, height: Math.max(1, Math.round(512 / ratio)) } : { width: Math.max(1, Math.round(512 * ratio)), height: 512 };
}

async function renderItem(item: StickerItem, canvas: HTMLCanvasElement) {
  const image = await loadImage(imageUrl(item));
  const ratio = outputRatio(item, image);
  const { width, height } = dimensionsForRatio(ratio);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is unavailable");
  context.clearRect(0, 0, width, height);
  const baseScale = item.crop.aspect === "Original" ? Math.min(width / image.naturalWidth, height / image.naturalHeight) : Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const scale = baseScale * item.crop.zoom;
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const x = (width - drawWidth) / 2 + item.crop.offsetX * width / 100;
  const y = (height - drawHeight) / 2 + item.crop.offsetY * height / 100;
  context.filter = `brightness(${item.crop.brightness}%) contrast(${item.crop.contrast}%) saturate(${item.crop.saturation}%)`;
  context.drawImage(image, x, y, drawWidth, drawHeight);
  context.filter = "none";
  return { image, x, y, drawWidth, drawHeight };
}

function applyWand(canvas: HTMLCanvasElement, x: number, y: number, tolerance: number, feather: number, connected: boolean) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const start = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
  const target = [data[start], data[start + 1], data[start + 2]];
  const distance = (index: number) => Math.hypot(data[index] - target[0], data[index + 1] - target[1], data[index + 2] - target[2]);
  const threshold = tolerance * 1.73;
  const soften = feather * 1.73;
  const remove = (pixel: number) => {
    const index = pixel * 4;
    const delta = distance(index);
    if (delta <= threshold) data[index + 3] = 0;
    else if (soften > 0 && delta < threshold + soften) data[index + 3] = Math.round(data[index + 3] * (delta - threshold) / soften);
  };
  if (!connected) {
    for (let pixel = 0; pixel < canvas.width * canvas.height; pixel++) remove(pixel);
  } else {
    const size = canvas.width * canvas.height;
    const visited = new Uint8Array(size);
    const queue = new Int32Array(size);
    let head = 0, tail = 0;
    const origin = Math.floor(y) * canvas.width + Math.floor(x);
    queue[tail++] = origin;
    visited[origin] = 1;
    while (head < tail) {
      const pixel = queue[head++];
      const index = pixel * 4;
      if (distance(index) > threshold + soften) continue;
      remove(pixel);
      const px = pixel % canvas.width;
      const py = Math.floor(pixel / canvas.width);
      const neighbors = [px > 0 ? pixel - 1 : -1, px + 1 < canvas.width ? pixel + 1 : -1, py > 0 ? pixel - canvas.width : -1, py + 1 < canvas.height ? pixel + canvas.width : -1];
      neighbors.forEach((next) => { if (next >= 0 && !visited[next]) { visited[next] = 1; queue[tail++] = next; } });
    }
  }
  context.putImageData(image, 0, 0);
}

function refineAlpha(canvas: HTMLCanvasElement, soften: boolean) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const source = new Uint8ClampedArray(image.data);
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    const index = (y * canvas.width + x) * 4 + 3;
    if (!soften) image.data[index] = source[index] < 96 ? 0 : source[index] > 224 ? 255 : source[index];
    else {
      let sum = 0, count = 0;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const nx = x + ox, ny = y + oy;
        if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) { sum += source[(ny * canvas.width + nx) * 4 + 3]; count++; }
      }
      image.data[index] = Math.round(sum / count);
    }
  }
  context.putImageData(image, 0, 0);
}

export default function TelegramStickerMaker() {
  const [items, setItems] = useState<StickerItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [quality, setQuality] = useState<Quality>("isnet_fp16");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [mode, setMode] = useState<EditMode>("pan");
  const [wandConnected, setWandConnected] = useState(true);
  const [tolerance, setTolerance] = useState(32);
  const [feather, setFeather] = useState(8);
  const [brushSize, setBrushSize] = useState(32);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [webpQuality, setWebpQuality] = useState(92);
  const [split, setSplit] = useState({ mode: "grid" as "grid" | "manual", rows: 2, columns: 2, horizontal: "", vertical: "", order: "rows" as "rows" | "columns", removeOriginal: false });
  const [helpOpen, setHelpOpen] = useState(false);
  const [message, setMessage] = useState("Drop, paste, or choose one or more images to begin.");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const urlsRef = useRef(new Set<string>());
  const paintingRef = useRef(false);
  const paintHistoryRef = useRef<string[]>([]);
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const renderRef = useRef<Awaited<ReturnType<typeof renderItem>> | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const current = items.find((item) => item.id === activeId) ?? items[0] ?? null;
  const currentIndex = current ? items.findIndex((item) => item.id === current.id) : -1;

  const trackUrl = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    urlsRef.current.add(url);
    return url;
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (!images.length) return;
    const additions = images.map((file) => ({ id: crypto.randomUUID(), name: file.name, file, originalUrl: trackUrl(file), history: [], crop: { ...DEFAULT_CROP } }));
    setItems((existing) => [...existing, ...additions]);
    setActiveId((id) => id ?? additions[0].id);
    setMessage(`${additions.length} image${additions.length === 1 ? "" : "s"} added. Choose Remove current or Remove all.`);
  }, [trackUrl]);

  useEffect(() => () => { urlsRef.current.forEach((url) => URL.revokeObjectURL(url)); }, []);

  useEffect(() => {
    const prevent = (event: DragEvent) => event.preventDefault();
    const drop = (event: DragEvent) => { event.preventDefault(); addFiles(Array.from(event.dataTransfer?.files ?? [])); };
    const paste = (event: ClipboardEvent) => addFiles(Array.from(event.clipboardData?.files ?? []));
    document.addEventListener("dragover", prevent);
    document.addEventListener("drop", drop);
    document.addEventListener("paste", paste);
    return () => { document.removeEventListener("dragover", prevent); document.removeEventListener("drop", drop); document.removeEventListener("paste", paste); };
  }, [addFiles]);

  const navigate = useCallback((direction: number) => {
    if (!items.length) return;
    const index = currentIndex < 0 ? 0 : (currentIndex + direction + items.length) % items.length;
    setActiveId(items[index].id);
  }, [currentIndex, items]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft") navigate(-1);
      else if (event.key === "ArrowRight") navigate(1);
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); undo(); }
      else if (event.key === "?") setHelpOpen(true);
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  });

  const updateCurrent = useCallback((change: (item: StickerItem) => StickerItem) => {
    if (!current) return;
    setItems((all) => all.map((item) => item.id === current.id ? change(item) : item));
  }, [current]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !current) return;
    let cancelled = false;
    void renderItem(current, canvas).then((rendered) => { if (!cancelled) renderRef.current = rendered; }).catch(() => setMessage("This image could not be rendered."));
    return () => { cancelled = true; };
  }, [current]);

  async function commitCanvas(history: string[]) {
    const canvas = canvasRef.current;
    if (!canvas || !current) return;
    const blob = await canvasBlob(canvas, "png");
    const editUrl = trackUrl(blob);
    updateCurrent((item) => ({ ...item, editUrl, history }));
  }

  function pushHistory() {
    const canvas = canvasRef.current;
    return current && canvas ? [...current.history, canvas.toDataURL("image/png")] : current?.history ?? [];
  }

  function undo() {
    if (!current?.history.length) return;
    const history = [...current.history];
    const previous = history.pop();
    updateCurrent((item) => ({ ...item, editUrl: previous, history }));
    setMessage("Last manual edit undone.");
  }

  function startOver() {
    if (!current) return;
    updateCurrent((item) => ({ ...item, resultUrl: undefined, editUrl: undefined, history: [], crop: { ...DEFAULT_CROP } }));
    setMessage("Current image reset to its original state.");
  }

  async function removeBackground(targets: StickerItem[]) {
    if (!targets.length || busy) return;
    setBusy(true);
    try {
      const module = await import("@imgly/background-removal");
      for (let index = 0; index < targets.length; index++) {
        const target = targets[index];
        setProgress(`Removing background ${index + 1} of ${targets.length}…`);
        const blob = await module.removeBackground(target.file, {
          model: quality,
          progress: (key: string, loaded: number, total: number) => setProgress(key.startsWith("fetch") ? `Downloading AI model… ${Math.round(loaded / total * 100)}%` : `Removing background ${index + 1} of ${targets.length}…`),
        });
        const resultUrl = trackUrl(blob);
        setItems((all) => all.map((item) => item.id === target.id ? { ...item, resultUrl, editUrl: undefined, history: [] } : item));
      }
      setMessage(`${targets.length} image${targets.length === 1 ? "" : "s"} processed locally.`);
    } catch {
      setMessage("Background removal failed. Try a smaller image, Balanced/Fast model, or another WebAssembly-capable browser.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  function removeItem(id: string) {
    const index = items.findIndex((item) => item.id === id);
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    if (id === activeId) setActiveId(next[Math.min(index, next.length - 1)]?.id ?? null);
  }

  function canvasPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  }

  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = canvasPoint(event);
    if (mode === "wand") {
      const history = pushHistory();
      applyWand(event.currentTarget, point.x, point.y, tolerance, feather, wandConnected);
      void commitCanvas(history);
      setMessage(`${wandConnected ? "Connected" : "Global"} color area removed.`);
    } else if (mode === "pan") {
      dragRef.current = { x: event.clientX, y: event.clientY, offsetX: current.crop.offsetX, offsetY: current.crop.offsetY };
    } else {
      paintingRef.current = true;
      updateCurrent((item) => ({ ...item, history: pushHistory() }));
      paint(event);
    }
  }

  function paint(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!paintingRef.current || !current || (mode !== "erase" && mode !== "restore")) return;
    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");
    const rendered = renderRef.current;
    if (!context || !rendered) return;
    const { x, y } = canvasPoint(event);
    context.save();
    context.beginPath();
    context.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    context.clip();
    if (mode === "erase") {
      context.globalCompositeOperation = "destination-out";
      context.fillStyle = "#000";
      context.fillRect(x - brushSize, y - brushSize, brushSize * 2, brushSize * 2);
    } else {
      context.globalCompositeOperation = "source-over";
      context.filter = `brightness(${current.crop.brightness}%) contrast(${current.crop.contrast}%) saturate(${current.crop.saturation}%)`;
      context.drawImage(rendered.image, rendered.x, rendered.y, rendered.drawWidth, rendered.drawHeight);
    }
    context.restore();
  }

  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (mode === "pan" && dragRef.current && current) {
      const rect = event.currentTarget.getBoundingClientRect();
      const dx = (event.clientX - dragRef.current.x) / rect.width * 100;
      const dy = (event.clientY - dragRef.current.y) / rect.height * 100;
      updateCurrent((item) => ({ ...item, crop: { ...item.crop, offsetX: dragRef.current!.offsetX + dx, offsetY: dragRef.current!.offsetY + dy } }));
    } else paint(event);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (paintingRef.current && current) {
      paintingRef.current = false;
      void commitCanvas(current.history);
      setMessage(mode === "erase" ? "Brush erase applied." : "Original pixels restored.");
    }
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function applyRefinement(soften: boolean) {
    const canvas = canvasRef.current;
    if (!canvas || !current) return;
    const history = pushHistory();
    refineAlpha(canvas, soften);
    void commitCanvas(history);
    setMessage(soften ? "Edges softened." : "Faint edge pixels cleared.");
  }

  function updateCrop<K extends keyof Crop>(key: K, value: Crop[K]) {
    updateCurrent((item) => ({ ...item, crop: { ...item.crop, [key]: value } }));
  }

  function applyCropToAll() {
    if (!current) return;
    setItems((all) => all.map((item) => ({ ...item, crop: { ...current.crop } })));
    setMessage("Crop, framing, and adjustments applied to the whole batch.");
  }

  async function splitSheet() {
    if (!current) return;
    setBusy(true);
    try {
      const source = await loadImage(imageUrl(current));
      const percentages = (value: string) => value.split(/[,\s]+/).map(Number).filter((number) => number > 0 && number < 100).sort((a, b) => a - b);
      const horizontal = split.mode === "grid" ? Array.from({ length: Math.max(1, split.rows) - 1 }, (_, index) => (index + 1) * 100 / Math.max(1, split.rows)) : percentages(split.horizontal);
      const vertical = split.mode === "grid" ? Array.from({ length: Math.max(1, split.columns) - 1 }, (_, index) => (index + 1) * 100 / Math.max(1, split.columns)) : percentages(split.vertical);
      const ys = [0, ...horizontal, 100], xs = [0, ...vertical, 100];
      const cells: { row: number; column: number; blob: Blob }[] = [];
      for (let row = 0; row < ys.length - 1; row++) for (let column = 0; column < xs.length - 1; column++) {
        const sx = Math.round(xs[column] / 100 * source.naturalWidth), sy = Math.round(ys[row] / 100 * source.naturalHeight);
        const sw = Math.max(1, Math.round((xs[column + 1] - xs[column]) / 100 * source.naturalWidth));
        const sh = Math.max(1, Math.round((ys[row + 1] - ys[row]) / 100 * source.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = sw; canvas.height = sh;
        canvas.getContext("2d")?.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
        cells.push({ row, column, blob: await canvasBlob(canvas, "png") });
      }
      cells.sort((a, b) => split.order === "rows" ? a.row - b.row || a.column - b.column : a.column - b.column || a.row - b.row);
      const additions = cells.map((cell, index) => {
        const file = new File([cell.blob], `${safeName(current.name)}-${index + 1}.png`, { type: "image/png" });
        return { id: crypto.randomUUID(), name: file.name, file, originalUrl: trackUrl(file), history: [], crop: { ...DEFAULT_CROP } } satisfies StickerItem;
      });
      setItems((all) => [...(split.removeOriginal ? all.filter((item) => item.id !== current.id) : all), ...additions]);
      setActiveId(additions[0]?.id ?? null);
      setMessage(`Sheet split into ${additions.length} stickers in ${split.order === "rows" ? "row" : "column"} reading order.`);
    } catch {
      setMessage("The current sheet could not be split.");
    } finally {
      setBusy(false);
    }
  }

  async function renderedBlob(item: StickerItem) {
    const canvas = document.createElement("canvas");
    await renderItem(item, canvas);
    return canvasBlob(canvas, format, webpQuality / 100);
  }

  async function exportCurrent() {
    if (!current) return;
    setBusy(true);
    try {
      const blob = await renderedBlob(current);
      downloadBlob(blob, `${safeName(current.name)}-512.${format}`);
      setMessage(`Sticker exported as ${format.toUpperCase()} with a 512 px long side.`);
    } catch { setMessage("Export failed for this sticker."); }
    finally { setBusy(false); }
  }

  async function exportAll() {
    if (!items.length) return;
    setBusy(true);
    setProgress("Building sticker ZIP…");
    try {
      const zip = new JSZip();
      for (let index = 0; index < items.length; index++) {
        setProgress(`Exporting ${index + 1} of ${items.length}…`);
        zip.file(`${String(index + 1).padStart(2, "0")}-${safeName(items[index].name)}.${format}`, await renderedBlob(items[index]));
      }
      downloadBlob(await zip.generateAsync({ type: "blob", compression: "DEFLATE" }), "telegram-stickers-512.zip");
      setMessage(`${items.length} stickers exported in a ZIP file.`);
    } catch { setMessage("Batch export failed."); }
    finally { setBusy(false); setProgress(""); }
  }

  const sourceCount = items.length;
  const aspectHint = current ? current.crop.aspect === "Custom" ? `${current.crop.customW}:${current.crop.customH}` : current.crop.aspect : "1:1";

  return (
    <ToolShell title="Telegram Sticker Maker" khmerTitle="កម្មវិធីបង្កើត Sticker Telegram" description="Prepare local 512 px Telegram stickers through batch upload, AI background removal, manual cleanup, framing, sheet splitting, adjustments, and PNG/WEBP/ZIP export." descriptionKm="រៀបចំ Sticker Telegram ទំហំ ៥១២ px ក្នុងម៉ាស៊ីនរបស់អ្នក ជាមួយការបញ្ចូលជាបាច់ ដកផ្ទៃក្រោយដោយ AI កែសម្អាត កាត់ស៊ុម បំបែកផ្ទាំង កែពណ៌ និងនាំចេញ PNG/WEBP/ZIP។">
      <div className="space-y-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-sm text-[var(--ink-dim)]"><strong className="text-[var(--ink)]">Local-first workflow</strong><p>Images are not uploaded. Background-removal code is installed with this app; its model assets download on first use and are cached by your browser. Exports are generated locally.</p></div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--gold-dim)] bg-[var(--gold)]/5 p-3 text-xs text-[var(--ink-dim)]" role="status" aria-live="polite"><span>{busy ? progress || "Working…" : message}</span><Button type="button" onClick={() => setHelpOpen((open) => !open)} className="inline-flex items-center gap-1 !px-3 !py-1.5"><HelpCircle size={13} /> Help & shortcuts</Button></div>
      {helpOpen && <section className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-sm text-[var(--ink-dim)]"><h2 className="font-medium text-[var(--ink)]">Workflow and shortcuts</h2><ol className="mt-2 list-decimal space-y-1 pl-5"><li>Drop, paste, or choose images.</li><li>Remove the current background or process the full batch.</li><li>Use Wand, Erase, Restore, edge cleanup, framing, and adjustments.</li><li>Optionally split a sticker sheet, then export one file or a ZIP.</li></ol><p className="mt-2">←/→ navigate · Ctrl/⌘ Z undo · ? toggles help. Telegram static stickers are exported with a 512 px long side.</p></section>}
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center transition hover:border-[var(--gold-dim)]"><ImagePlus className="text-[var(--gold)]" /><strong className="text-[var(--ink)]">Choose images</strong><span className="text-xs text-[var(--ink-dim)]">or drop anywhere on this page / paste from clipboard</span><input type="file" accept="image/*" multiple className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} /></label>

      {items.length > 0 && <>
        <section><div className="mb-2 flex items-center justify-between"><h2 className="font-display text-sm font-medium text-[var(--ink)]">Batch — {sourceCount} image{sourceCount === 1 ? "" : "s"}</h2><span className="text-xs text-[var(--ink-faint)]">{currentIndex + 1} / {sourceCount}</span></div><div className="flex gap-2 overflow-x-auto pb-2">{items.map((item, index) => <div key={item.id} className={`relative shrink-0 rounded-md border p-1 ${item.id === current?.id ? "border-[var(--gold)] bg-[var(--gold)]/10" : "border-[var(--ground-line)]"}`}><button type="button" onClick={() => setActiveId(item.id)} className="block" aria-label={`Open ${item.name}`}><span className="absolute left-1 top-1 z-10 rounded bg-black/70 px-1 text-[10px] text-white">{index + 1}</span>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={imageUrl(item)} alt="" className="h-20 w-20 rounded object-contain [background:repeating-conic-gradient(#ddd_0_25%,#fff_0_50%)_0/12px_12px]" /><span className="block w-20 truncate px-1 pt-1 text-[10px] text-[var(--ink-dim)]">{item.name}</span></button><button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`} className="absolute right-0 top-0 rounded-bl bg-black/70 px-1.5 text-xs text-white">×</button></div>)}</div></section>
        <section className="grid gap-4 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 md:grid-cols-[minmax(12rem,0.65fr)_minmax(0,1.35fr)]">
          <div className="space-y-4"><h2 className="font-display font-semibold text-[var(--ink)]">1. Automatic cutout</h2><Field label="AI model quality" hint="Balanced is recommended"><Select value={quality} onChange={(event) => setQuality(event.target.value as Quality)}><option value="isnet_fp16">Balanced</option><option value="isnet">Highest quality</option><option value="isnet_quint8">Fastest</option></Select></Field><div className="flex flex-wrap gap-2"><Button type="button" disabled={busy || !current} onClick={() => current && void removeBackground([current])} className="inline-flex items-center gap-2"><Sparkles size={14} /> Remove current</Button><Button type="button" disabled={busy} onClick={() => void removeBackground(items)} className="inline-flex items-center gap-2 !bg-[var(--ground-raised-hi)] !text-[var(--ink)] ring-1 ring-[var(--ground-line)]"><Sparkles size={14} /> Remove all</Button></div><p className="text-xs text-[var(--ink-dim)]">Undo and Start over affect only the selected image. Batch files remain in memory until you leave or remove them.</p></div>
          <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display font-semibold text-[var(--ink)]">2. Frame and clean</h2><div className="flex gap-2"><Button type="button" onClick={undo} disabled={!current?.history.length} className="inline-flex items-center gap-1 !px-3 !py-1.5"><Undo2 size={13} /> Undo</Button><Button type="button" onClick={startOver} className="inline-flex items-center gap-1 !bg-[var(--ground-raised-hi)] !px-3 !py-1.5 !text-[var(--ink)] ring-1 ring-[var(--ground-line)]"><Redo2 size={13} /> Start over</Button></div></div><div className="flex flex-wrap gap-2">{(["pan", "wand", "erase", "restore"] as EditMode[]).map((tool) => <Button key={tool} type="button" onClick={() => setMode(tool)} className={`${mode === tool ? "" : "!bg-[var(--ground-raised-hi)] !text-[var(--ink)] ring-1 ring-[var(--ground-line)]"} inline-flex items-center gap-1 !px-3 !py-1.5`}>{tool === "wand" ? <WandSparkles size={13} /> : tool === "erase" ? <Eraser size={13} /> : null}{tool[0].toUpperCase() + tool.slice(1)}</Button>)}</div>
            <div className="relative mx-auto max-w-2xl overflow-hidden rounded-lg border border-[var(--ground-line)] [background:repeating-conic-gradient(#d6d6d6_0_25%,#fff_0_50%)_0/18px_18px]"><canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} className={`mx-auto block max-h-[65vh] max-w-full touch-none ${mode === "pan" ? "cursor-grab active:cursor-grabbing" : mode === "wand" ? "cursor-crosshair" : "cursor-none"}`} /></div><p className="text-center text-xs text-[var(--ink-faint)]">{mode === "pan" ? "Drag to position the image inside the frame." : mode === "wand" ? "Click a color area to make it transparent." : mode === "erase" ? "Paint to erase pixels." : "Paint to restore original pixels."}</p></div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-4 rounded-lg border border-[var(--ground-line)] p-4"><h2 className="font-display font-semibold text-[var(--ink)]">Manual cleanup</h2><label className="flex items-center gap-2 text-sm text-[var(--ink)]"><input type="checkbox" checked={wandConnected} onChange={(event) => setWandConnected(event.target.checked)} /> Connected wand <span className="text-xs text-[var(--ink-faint)]">(off = global)</span></label><Range label={`Wand tolerance: ${tolerance}`} min={0} max={128} value={tolerance} onChange={setTolerance} /><Range label={`Edge feather: ${feather}px`} min={0} max={48} value={feather} onChange={setFeather} /><Range label={`Brush size: ${brushSize}px`} min={4} max={128} value={brushSize} onChange={setBrushSize} /><div className="flex flex-wrap gap-2"><Button type="button" onClick={() => applyRefinement(false)} className="!px-3 !py-1.5">Clear faint edges</Button><Button type="button" onClick={() => applyRefinement(true)} className="!bg-[var(--ground-raised-hi)] !px-3 !py-1.5 !text-[var(--ink)] ring-1 ring-[var(--ground-line)]">Soften edges</Button></div></div>
          <div className="space-y-4 rounded-lg border border-[var(--ground-line)] p-4"><h2 className="font-display font-semibold text-[var(--ink)]">Crop & framing — {aspectHint}</h2><Field label="Aspect ratio"><Select value={current?.crop.aspect} onChange={(event) => updateCrop("aspect", event.target.value)}>{ASPECTS.map((aspect) => <option key={aspect}>{aspect}</option>)}</Select></Field>{current?.crop.aspect === "Custom" && <Row><Field label="Width"><TextInput type="number" min="1" value={current.crop.customW} onChange={(event) => updateCrop("customW", Math.max(1, Number(event.target.value)))} /></Field><Field label="Height"><TextInput type="number" min="1" value={current.crop.customH} onChange={(event) => updateCrop("customH", Math.max(1, Number(event.target.value)))} /></Field></Row>}<Range label={`Zoom: ${Math.round((current?.crop.zoom ?? 1) * 100)}%`} min={50} max={300} value={Math.round((current?.crop.zoom ?? 1) * 100)} onChange={(value) => updateCrop("zoom", value / 100)} /><div className="flex flex-wrap gap-2"><Button type="button" onClick={() => updateCurrent((item) => ({ ...item, crop: { ...item.crop, zoom: 1, offsetX: 0, offsetY: 0 } }))} className="!px-3 !py-1.5">Fit / center</Button><Button type="button" onClick={applyCropToAll} className="!bg-[var(--ground-raised-hi)] !px-3 !py-1.5 !text-[var(--ink)] ring-1 ring-[var(--ground-line)]">Apply to batch</Button></div></div>
          <div className="space-y-4 rounded-lg border border-[var(--ground-line)] p-4"><h2 className="font-display font-semibold text-[var(--ink)]">Color adjustments</h2><Range label={`Brightness: ${current?.crop.brightness ?? 100}%`} min={0} max={200} value={current?.crop.brightness ?? 100} onChange={(value) => updateCrop("brightness", value)} /><Range label={`Contrast: ${current?.crop.contrast ?? 100}%`} min={0} max={200} value={current?.crop.contrast ?? 100} onChange={(value) => updateCrop("contrast", value)} /><Range label={`Saturation: ${current?.crop.saturation ?? 100}%`} min={0} max={200} value={current?.crop.saturation ?? 100} onChange={(value) => updateCrop("saturation", value)} /><Button type="button" onClick={() => updateCurrent((item) => ({ ...item, crop: { ...item.crop, brightness: 100, contrast: 100, saturation: 100 } }))} className="!bg-[var(--ground-raised-hi)] !px-3 !py-1.5 !text-[var(--ink)] ring-1 ring-[var(--ground-line)]">Reset adjustments</Button></div>
        </section>
        <section className="space-y-4 rounded-lg border border-[var(--ground-line)] p-4"><div><h2 className="font-display font-semibold text-[var(--ink)]"><Scissors size={16} className="mr-2 inline" />3. Sticker-sheet splitter</h2><p className="mt-1 text-xs text-[var(--ink-dim)]">Create separate batch items from a regular grid or manually marked percentage cuts.</p></div><Row><Field label="Split method"><Select value={split.mode} onChange={(event) => setSplit({ ...split, mode: event.target.value as typeof split.mode })}><option value="grid">Generated grid</option><option value="manual">Manual cut marks</option></Select></Field><Field label="Reading order"><Select value={split.order} onChange={(event) => setSplit({ ...split, order: event.target.value as typeof split.order })}><option value="rows">Rows: left → right, top → bottom</option><option value="columns">Columns: top → bottom, left → right</option></Select></Field></Row>{split.mode === "grid" ? <Row><Field label="Rows"><TextInput type="number" min="1" max="20" value={split.rows} onChange={(event) => setSplit({ ...split, rows: Math.min(20, Math.max(1, Number(event.target.value))) })} /></Field><Field label="Columns"><TextInput type="number" min="1" max="20" value={split.columns} onChange={(event) => setSplit({ ...split, columns: Math.min(20, Math.max(1, Number(event.target.value))) })} /></Field></Row> : <Row><Field label="Horizontal cuts (%)" hint="Example: 25, 50, 75"><TextInput value={split.horizontal} onChange={(event) => setSplit({ ...split, horizontal: event.target.value })} /></Field><Field label="Vertical cuts (%)" hint="Example: 33.3, 66.7"><TextInput value={split.vertical} onChange={(event) => setSplit({ ...split, vertical: event.target.value })} /></Field></Row>}<label className="flex items-center gap-2 text-sm text-[var(--ink)]"><input type="checkbox" checked={split.removeOriginal} onChange={(event) => setSplit({ ...split, removeOriginal: event.target.checked })} /> Remove original sheet after splitting</label><Button type="button" disabled={busy || !current} onClick={() => void splitSheet()} className="inline-flex items-center gap-2"><Scissors size={14} /> Split current sheet</Button></section>

        <section className="space-y-4 rounded-lg border border-[var(--gold-dim)] bg-[var(--gold)]/5 p-4"><div><h2 className="font-display font-semibold text-[var(--ink)]"><Download size={16} className="mr-2 inline" />4. Telegram-ready export</h2><p className="mt-1 text-xs text-[var(--ink-dim)]">Each sticker is rendered with a 512 px long side and transparent background where supported.</p></div><Row><Field label="Format"><Select value={format} onChange={(event) => setFormat(event.target.value as ExportFormat)}><option value="png">PNG — lossless transparency</option><option value="webp">WEBP — smaller file</option></Select></Field>{format === "webp" ? <Field label={`WEBP quality: ${webpQuality}%`}><input type="range" min="1" max="100" value={webpQuality} onChange={(event) => setWebpQuality(Number(event.target.value))} className="w-full accent-[var(--gold)]" /></Field> : <div />}</Row><div className="flex flex-wrap gap-2"><Button type="button" disabled={busy || !current} onClick={() => void exportCurrent()} className="inline-flex items-center gap-2"><Download size={14} /> Download current {format.toUpperCase()}</Button><Button type="button" disabled={busy || !items.length} onClick={() => void exportAll()} className="inline-flex items-center gap-2 !bg-[var(--ground-raised-hi)] !text-[var(--ink)] ring-1 ring-[var(--ground-line)]"><Download size={14} /> Download batch ZIP</Button></div></section>
      </>}
    </ToolShell>
  );
}

function Range({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (value: number) => void }) {
  return <label className="block text-xs text-[var(--ink-dim)]"><span className="mb-1 block">{label}</span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-[var(--gold)]" /></label>;
}