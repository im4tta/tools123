"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ClipboardPaste, Download, ExternalLink, Mail, MapPin, Phone, Trash2 } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { recordExport } from "@/lib/export";

interface HistItem {
  value: string;
  at: number;
}

type DetectedKind = "url" | "phone" | "email" | "address" | "text";

interface Detection {
  kind: DetectedKind;
  href?: string;
}

function detectKind(value: string): Detection {
  const v = value.trim();
  const lower = v.toLowerCase();

  if (/^https?:\/\//i.test(v) || lower.startsWith("www.")) {
    return { kind: "url", href: /^https?:\/\//i.test(v) ? v : `https://${v}` };
  }
  if (lower.startsWith("tel:")) return { kind: "phone", href: v };
  if (lower.startsWith("mailto:")) return { kind: "email", href: v };
  if (lower.startsWith("geo:")) {
    return { kind: "address", href: `https://maps.google.com/?q=${encodeURIComponent(v.slice(4))}` };
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { kind: "email", href: `mailto:${v}` };
  const digitsOnly = v.replace(/[^\d]/g, "");
  if (/^\+?[\d\s().-]{7,}$/.test(v) && digitsOnly.length >= 7 && digitsOnly.length <= 15) {
    return { kind: "phone", href: `tel:${v.replace(/[^\d+]/g, "")}` };
  }
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+[^\s]*$/i.test(v)) {
    return { kind: "url", href: `https://${v}` };
  }
  return { kind: "text" };
}

export default function QrDecoderTool() {
  const { text } = useLanguage();
  const [result, setResult] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [history, setHistory] = useToolState<HistItem[]>("qr-decoder:history", []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const detection = result ? detectKind(result) : null;

  function pushHistory(value: string) {
    setHistory((prev) => [{ value, at: Date.now() }, ...prev.filter((h) => h.value !== value)].slice(0, 8));
  }

  async function decodeFromImageData(imageData: ImageData) {
    const jsQR = (await import("jsqr")).default;
    return jsQR(imageData.data, imageData.width, imageData.height);
  }

  async function handleFile(file: File) {
    setBusy(true);
    setNotFound(false);
    setResult(null);
    try {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Could not load image"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = await decodeFromImageData(imageData);
      if (code) {
        setResult(code.data);
        pushHistory(code.data);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setBusy(false);
    }
  }

  async function pasteFromClipboard() {
    try {
      if (!navigator.clipboard?.read) {
        setNotFound(true);
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith("image/"));
        if (type) {
          const blob = await item.getType(type);
          const file = new File([blob], "clipboard-image.png", { type: blob.type });
          void handleFile(file);
          return;
        }
      }
      setNotFound(true);
    } catch {
      setNotFound(true);
    }
  }

  async function startScan() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      setNotFound(false);
      loopScan();
    } catch {
      setNotFound(true);
    }
  }

  function stopScan() {
    setScanning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function loopScan() {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(loopScan);
      return;
    }
    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      decodeFromImageData(imageData).then((code) => {
        if (code) {
          setResult(code.data);
          pushHistory(code.data);
          stopScan();
        } else {
          rafRef.current = requestAnimationFrame(loopScan);
        }
      });
      return;
    }
    rafRef.current = requestAnimationFrame(loopScan);
  }

  function saveResult() {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qr-content.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
    recordExport();
  }

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (file) {
        event.preventDefault();
        void handleFile(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => stopScan(), []);

  const actionButtonClass = "inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]";

  return (
    <ToolShell
      title="QR Code Decoder"
      khmerTitle="អានកូដ QR"
      description="Upload an image, drag a file in, paste from your clipboard with Ctrl+V, or scan live with your camera to read a QR code's content — decoded entirely in your browser, nothing leaves your device."
      descriptionKm="ផ្ទុករូបភាព អូសឯកសារចូល បិទភ្ជាប់ដោយ Ctrl+V ឬស្កេនតាមកាមេរ៉ាដើម្បីអានខ្លឹមសារកូដ QR — ឌិកូដនៅក្នុងកម្មវិធីរុករកទាំងស្រុង គ្មានអ្វីចាកចេញពីឧបករណ៍របស់អ្នកទេ។"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition ${
            dragOver ? "border-[var(--gold)] bg-[var(--ground-raised-hi)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] hover:border-[var(--gold-dim)]"
          }`}
        >
          <span>{busy ? text("Reading…", "កំពុងអាន…") : text("Click or drop an image", "ចុច ឬអូសរូបភាពមកទីនេះ")}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
          />
        </label>

        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)]">
          {scanning ? (
            <Button onClick={stopScan} className="!bg-[var(--danger)]"><CameraOff size={13} className="mr-1.5 inline" />{text("Stop camera", "បិទកាមេរ៉ា")}</Button>
          ) : (
            <Button onClick={() => void startScan()}><Camera size={13} className="mr-1.5 inline" />{text("Scan with camera", "ស្កេនជាមួយកាមេរ៉ា")}</Button>
          )}
          <span className="text-xs text-[var(--ink-faint)]">{text("Live scan, nothing recorded", "ស្កេនផ្ទាល់ គ្មានការរក្សាទុក")}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/40 px-3 py-2">
        <button type="button" className={actionButtonClass} onClick={() => void pasteFromClipboard()}>
          <ClipboardPaste size={13} className="text-[var(--gold)]" /> {text("Paste image from clipboard", "បិទភ្ជាប់រូបភាព")}
        </button>
        <span className="text-xs text-[var(--ink-faint)]">{text("Tip: press Ctrl+V (⌘V) anywhere on this page to paste a copied screenshot.", "គន្លឹះ៖ ចុច Ctrl+V (⌘V) នៅទំព័រនេះដើម្បីបិទភ្ជាប់រូបថតអេក្រង់។")}</span>
      </div>

      {scanning && (
        <video ref={videoRef} muted playsInline className="w-full rounded-md border border-[var(--ground-line)]" />
      )}

      {previewUrl && !scanning && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={text("Uploaded QR image", "រូបភាព QR ដែលបានផ្ទុក")} className="max-h-56 rounded-md border border-[var(--ground-line)] object-contain" />
      )}

      {result && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {detection?.kind === "url" && detection.href && (
              <a href={detection.href} target="_blank" rel="noopener noreferrer" className={actionButtonClass}>
                <ExternalLink size={13} className="text-[var(--teal)]" /> {text("Open link", "បើកតំណ")}
              </a>
            )}
            {detection?.kind === "phone" && detection.href && (
              <a href={detection.href} className={actionButtonClass}>
                <Phone size={13} className="text-[var(--teal)]" /> {text("Call number", "ទូរស័ព្ទទៅ")}
              </a>
            )}
            {detection?.kind === "email" && detection.href && (
              <a href={detection.href} className={actionButtonClass}>
                <Mail size={13} className="text-[var(--teal)]" /> {text("Send email", "ផ្ញើអ៊ីមែល")}
              </a>
            )}
            {detection?.kind === "address" && detection.href && (
              <a href={detection.href} target="_blank" rel="noopener noreferrer" className={actionButtonClass}>
                <MapPin size={13} className="text-[var(--teal)]" /> {text("Open in Maps", "បើកក្នុងផែនទី")}
              </a>
            )}
            <button type="button" className={actionButtonClass} onClick={saveResult}>
              <Download size={13} className="text-[var(--gold)]" /> {text("Save as .txt", "រក្សាទុកជា .txt")}
            </button>
          </div>
          <Output label={text("Decoded content", "ខ្លឹមសារដែលបានអាន")} value={result} />
        </div>
      )}
      {notFound && !busy && <Output label={text("Result", "លទ្ធផល")} value={text("No QR code found.", "រកមិនឃើញកូដ QR ទេ។")} error mono={false} />}

      {history.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{text("Recent scans", "ការស្កេនថ្មីៗ")}</span>
            <button onClick={() => setHistory([])} className="flex items-center gap-1 text-xs text-[var(--ink-faint)] hover:text-[var(--danger)]">
              <Trash2 size={11} /> {text("Clear", "សម្អាត")}
            </button>
          </div>
          <div className="space-y-1.5">
            {history.map((h) => (
              <button
                key={h.at}
                onClick={() => setResult(h.value)}
                className="block w-full truncate rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-left text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)]"
              >
                {h.value}
              </button>
            ))}
          </div>
        </div>
      )}
    </ToolShell>
  );
}
