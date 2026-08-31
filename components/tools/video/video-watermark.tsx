"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function mimeType() {
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  for (const m of candidates) if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  return "video/webm";
}

const fmtSize = (n: number) =>
  n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`;

const POSITIONS = ["tl", "tr", "bl", "br", "c"] as const;
type Position = (typeof POSITIONS)[number];

export default function VideoWatermark() {
  const { text: t } = useLanguage();
  const [mark, setMark] = useToolState("video-watermark:text", "© 2026");
  const [color, setColor] = useToolState("video-watermark:color", "#f5c542");
  const [opacity, setOpacity] = useToolState<number>("video-watermark:opacity", 60);
  const [position, setPosition] = useToolState<Position>("video-watermark:position", "br");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [srcDuration, setSrcDuration] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const drawWatermarkedFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 360;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const text = mark.trim();
    if (!text) return;

    const fontPx = Math.max(16, Math.round(w * 0.045));
    ctx.font = `600 ${fontPx}px system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = Math.max(2, Math.round(fontPx * 0.2));
    ctx.fillStyle = color;
    ctx.globalAlpha = Math.max(0.05, Math.min(1, opacity / 100));

    const tw = ctx.measureText(text).width;
    const margin = Math.max(14, Math.round(w * 0.03));
    let x = margin;
    let y = margin + fontPx / 2;
    if (position === "tr") {
      x = w - margin - tw;
      y = margin + fontPx / 2;
    } else if (position === "bl") {
      x = margin;
      y = h - margin - fontPx / 2;
    } else if (position === "br") {
      x = w - margin - tw;
      y = h - margin - fontPx / 2;
    } else {
      x = (w - tw) / 2;
      y = (h - fontPx) / 2 + fontPx / 2;
    }
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  };

  const stopLoop = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    videoRef.current?.pause();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
  };

  const startPreview = () => {
    const video = videoRef.current;
    if (!video) return;
    setError(null);
    setPreviewing(true);
    video.currentTime = 0;
    video.muted = true;
    video.playsInline = true;
    const tick = () => {
      drawWatermarkedFrame();
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    void video.play();
  };

  const togglePreview = () => {
    if (previewing) {
      stopLoop();
      setPreviewing(false);
      return;
    }
    startPreview();
  };

  const exportWebm = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    stopLoop();
    setBusy(true);
    setError(null);
    setResultUrl(null);
    setResultSize(0);
    setProgress(0);
    try {
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 360;
      canvas.width = w;
      canvas.height = h;

      const stream = canvas.captureStream(30);
      const rec = new MediaRecorder(stream, { mimeType: mimeType(), videoBitsPerSecond: 8_000_000 });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      const done = new Promise<Blob>((resolve) => {
        rec.onstop = () => resolve(new Blob(chunksRef.current, { type: "video/webm" }));
      });
      rec.start(500);
      recorderRef.current = rec;

      const tick = () => {
        drawWatermarkedFrame();
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      video.currentTime = 0;
      video.muted = true;
      video.playsInline = true;
      const total = video.duration || srcDuration;
      const prog = setInterval(() => {
        if (total) setProgress(Math.min(99, Math.round((video.currentTime / total) * 100)));
      }, 200);

      await video.play();
      await new Promise<void>((resolve) => {
        video.addEventListener("ended", () => resolve(), { once: true });
        video.addEventListener("error", () => resolve(), { once: true });
      });

      clearInterval(prog);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      rec.stop();
      recorderRef.current = null;
      const blob = await done;
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError(
        t(
          "Could not process this video in your browser — try a shorter clip or a lower resolution.",
          "មិនអាចដំណើរការវីដេអូនេះក្នុងកម្មវិធីរុករករបស់អ្នកបានទេ — សាកល្បងវីដេអូខ្លីជាង ឬគុណភាពទាបជាង។"
        )
      );
    } finally {
      setBusy(false);
      setPreviewing(false);
    }
  };

  function handleFile(f: File) {
    stopLoop();
    setPreviewing(false);
    if (url) URL.revokeObjectURL(url);
    setFile(f);
    setUrl(URL.createObjectURL(f));
    setSrcDuration(0);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      recorderRef.current?.stop();
      if (url) URL.revokeObjectURL(url);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const posLabel = (p: Position) =>
    p === "tl"
      ? t("Top left", "ជ្រុងលើឆ្វេង")
      : p === "tr"
        ? t("Top right", "ជ្រុងលើស្ដាំ")
        : p === "bl"
          ? t("Bottom left", "ជ្រុងក្រោមឆ្វេង")
          : p === "br"
            ? t("Bottom right", "ជ្រុងក្រោមស្ដាំ")
            : t("Center", "កណ្ដាល");

  return (
    <ToolShell
      title="Video Watermark"
      khmerTitle="ដាក់សញ្ញាទឹកលើវីដេអូ"
      description="Load a video, add a text watermark with your own text, color, opacity and position, preview it, and export a WebM copy."
      descriptionKm="ផ្ទុកវីដេអូ បន្ថែមសញ្ញាទឹកជាអត្ថបទជាមួយពណ៌ តម្លាភាព និងទីតាំងតាមជម្រើសរបស់អ្នក មើលជាមុន រួចនាំចេញជា WebM។"
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold)]">
        <span className="flex items-center gap-2">
          <Upload size={15} />
          {file ? file.name : t("Click to choose a video", "ចុចដើម្បីជ្រើសរើសវីដេអូ")}
        </span>
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>

      {url && (
        <>
          <video
            ref={videoRef}
            src={url}
            muted
            playsInline
            onLoadedMetadata={(e) => setSrcDuration(e.currentTarget.duration)}
            className="hidden"
          />
          <canvas
            ref={canvasRef}
            className="max-h-80 w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]"
          />

          <Row>
            <Field label={t("Watermark text", "អត្ថបទសញ្ញាទឹក")}>
              <TextInput value={mark} onChange={(e) => setMark(e.target.value)} />
            </Field>
            <Field label={t("Position", "ទីតាំង")}>
              <Select value={position} onChange={(e) => setPosition(e.target.value as Position)}>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {posLabel(p)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("Color", "ពណ៌")}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1"
              />
            </Field>
            <Field label={t("Opacity", "តម្លាភាព")} hint={`${opacity}%`}>
              <input
                type="range"
                min={5}
                max={100}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full"
              />
            </Field>
          </Row>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={togglePreview} disabled={busy}>
              {previewing ? t("Stop preview", "បញ្ឈប់ការមើល") : t("Preview watermark", "មើលជាមុន")}
            </Button>
            <Button type="button" onClick={() => void exportWebm()} disabled={busy}>
              {busy
                ? `${t("Exporting…", "កំពុងនាំចេញ…")} ${progress}%`
                : t("Export WebM", "នាំចេញ WebM")}
            </Button>
          </div>

          {busy && (
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ground-line)]">
              <div
                className="h-full rounded-full bg-[var(--gold)] transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          {resultUrl && resultSize > 0 && (
            <>
              <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                  {t("Watermarked video (WebM)", "វីដេអូមានសញ្ញាទឹក (WebM)")}
                </div>
                <div className="mt-1 text-lg font-semibold text-[var(--gold)]">{fmtSize(resultSize)}</div>
              </div>
              <a
                href={resultUrl}
                download="watermarked.webm"
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:opacity-90"
              >
                <Download size={13} />
                {t("Download WebM", "ទាញយក WebM")} — {fmtSize(resultSize)}
              </a>
            </>
          )}

          <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t(
              "The watermark is drawn onto every frame, then the video is re-encoded to WebM with MediaRecorder. The audio track is not carried into the output.",
              "សញ្ញាទឹកត្រូវបានគូរលើរាល់ស៊ុម បន្ទាប់មកវីដេអូត្រូវបានបង្ហាប់ឡើងវិញជា WebM ជាមួយ MediaRecorder។ ផ្នែកសំឡេងមិនត្រូវបានបញ្ចូលក្នុងលទ្ធផលទេ។"
            )}
          </p>
        </>
      )}
    </ToolShell>
  );
}
