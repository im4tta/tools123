"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Trash2 } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface HistItem {
  value: string;
  at: number;
}

export default function QrDecoderTool() {
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

  useEffect(() => () => stopScan(), []);

  return (
    <ToolShell
      title="QR Code Decoder"
      description="Upload an image, drag a file in, or scan live with your camera to read a QR code's content — decoded entirely in your browser, nothing leaves your device."
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
          <span>{busy ? "Reading…" : "Click or drop an image"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
          />
        </label>

        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)]">
          {scanning ? (
            <Button onClick={stopScan} className="!bg-[var(--danger)]"><CameraOff size={13} className="mr-1.5 inline" />Stop camera</Button>
          ) : (
            <Button onClick={startScan}><Camera size={13} className="mr-1.5 inline" />Scan with camera</Button>
          )}
          <span className="text-xs text-[var(--ink-faint)]">Live scan, nothing recorded</span>
        </div>
      </div>

      {scanning && (
        <video ref={videoRef} muted playsInline className="w-full rounded-md border border-[var(--ground-line)]" />
      )}

      {previewUrl && !scanning && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Uploaded" className="max-h-56 rounded-md border border-[var(--ground-line)] object-contain" />
      )}
      {result && <Output label="Decoded content" value={result} />}
      {notFound && !busy && <Output label="Result" value="No QR code found." error mono={false} />}

      {history.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">Recent scans</span>
            <button onClick={() => setHistory([])} className="flex items-center gap-1 text-xs text-[var(--ink-faint)] hover:text-[var(--danger)]">
              <Trash2 size={11} /> Clear
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
