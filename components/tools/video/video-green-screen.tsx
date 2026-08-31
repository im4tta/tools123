"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
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

export default function VideoGreenScreen() {
  const { text: t } = useLanguage();
  const [tolerance, setTolerance] = useToolState<number>("video-green:tolerance", 100);
  const [softness, setSoftness] = useToolState<number>("video-green:softness", 25);
  const [spill, setSpill] = useToolState("video-green:spill", "on");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [srcDuration, setSrcDuration] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopLoop = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    videoRef.current?.pause();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
  };

  const drawKeyedFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    const srcW = video.videoWidth || 640;
    const srcH = video.videoHeight || 360;
    const w = Math.min(srcW, 1280);
    const h = Math.max(1, Math.round((srcH / srcW) * w));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Background layer (or a dark backdrop when none is chosen).
    const bg = bgImgRef.current;
    if (bg && bg.complete && bg.naturalWidth > 0) {
      ctx.drawImage(bg, 0, 0, w, h);
    } else {
      ctx.fillStyle = "#0d1117";
      ctx.fillRect(0, 0, w, h);
    }

    // Keyed video layer: per-pixel chroma key on an offscreen copy.
    if (!tempCanvasRef.current) tempCanvasRef.current = document.createElement("canvas");
    const tmp = tempCanvasRef.current;
    tmp.width = w;
    tmp.height = h;
    const tctx = tmp.getContext("2d", { willReadFrequently: true });
    if (!tctx) return;
    tctx.drawImage(video, 0, 0, w, h);
    const img = tctx.getImageData(0, 0, w, h);
    const d = img.data;
    const tol = Math.max(0, Math.min(255, tolerance));
    const soft = Math.max(1, Math.min(255, softness));
    const suppress = spill === "on";
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const greenness = g - Math.max(r, b);
      let a = 1 - (greenness - tol) / soft;
      a = a < 0 ? 0 : a > 1 ? 1 : a;
      d[i + 3] = Math.round(a * 255);
      // Optional spill suppression: tone down green on kept pixels.
      if (suppress && a > 0) {
        const m = Math.max(r, b);
        if (g > m) d[i + 1] = Math.min(255, m + Math.round((g - m) * 0.35));
      }
    }
    tctx.putImageData(img, 0, 0);
    ctx.drawImage(tmp, 0, 0);
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
      drawKeyedFrame();
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
      const srcW = video.videoWidth || 640;
      const srcH = video.videoHeight || 360;
      const w = Math.min(srcW, 1280);
      const h = Math.max(1, Math.round((srcH / srcW) * w));
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
        drawKeyedFrame();
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

  function handleVideoFile(f: File) {
    stopLoop();
    setPreviewing(false);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setSrcDuration(0);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  function handleBgFile(f: File) {
    if (bgUrl) URL.revokeObjectURL(bgUrl);
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      bgImgRef.current = img;
    };
    img.src = url;
    setBgUrl(url);
    setError(null);
  }

  function clearBg() {
    if (bgUrl) URL.revokeObjectURL(bgUrl);
    bgImgRef.current = null;
    setBgUrl(null);
  }

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      recorderRef.current?.stop();
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (bgUrl) URL.revokeObjectURL(bgUrl);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <ToolShell
      title="Video Green Screen / Chroma Key"
      khmerTitle="ផ្ទៃបៃតងវីដេអូ"
      description="Load a green-screen video, remove the background with adjustable chroma-key controls, optionally add a background image, and export a WebM copy."
      descriptionKm="ផ្ទុកវីដេអូផ្ទៃបៃតង ដកផ្ទៃខាងក្រោយជាមួយការកែសម្រួល chroma key បន្ថែមរូបភាពផ្ទៃខាងក្រោយតាមតម្រូវការ រួចនាំចេញជា WebM។"
    >
      <Row>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-6 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold)]">
          <span className="flex items-center gap-2">
            <Upload size={15} />
            {videoFile ? videoFile.name : t("Click to choose a green-screen video", "ចុចដើម្បីជ្រើសរើសវីដេអូផ្ទៃបៃតង")}
          </span>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleVideoFile(f);
            }}
          />
        </label>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-6 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold)]">
          <span className="flex items-center gap-2">
            <Upload size={15} />
            {bgUrl ? t("Background image loaded", "រូបភាពផ្ទៃខាងក្រោយត្រូវបានផ្ទុក") : t("Optional background image", "រូបភាពផ្ទៃខាងក្រោយ (ស្រេចចិត្ត)")}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleBgFile(f);
            }}
          />
        </label>
      </Row>

      {bgUrl && (
        <button
          type="button"
          onClick={clearBg}
          className="text-xs font-medium text-[var(--danger)] hover:opacity-80"
        >
          {t("Remove background image", "លុបរូបភាពផ្ទៃខាងក្រោយ")}
        </button>
      )}

      {videoUrl && (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
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
            <Field label={t("Chroma tolerance", "កម្រិតអត់ធ្មត់")} hint={`${tolerance}`}>
              <input
                type="range"
                min={0}
                max={255}
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full"
              />
            </Field>
            <Field label={t("Edge softness", "ភាពទន់នៃគែម")} hint={`${softness}`}>
              <input
                type="range"
                min={1}
                max={120}
                value={softness}
                onChange={(e) => setSoftness(Number(e.target.value))}
                className="w-full"
              />
            </Field>
            <Field label={t("Spill suppression", "បង្ក្រាបការលេចពណ៌")}>
              <Select value={spill} onChange={(e) => setSpill(e.target.value)}>
                <option value="on">{t("On", "បើក")}</option>
                <option value="off">{t("Off", "បិទ")}</option>
              </Select>
            </Field>
          </Row>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={togglePreview} disabled={busy}>
              {previewing ? t("Stop preview", "បញ្ឈប់ការមើល") : t("Preview keying", "មើលជាមុន")}
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
                  {t("Keyed video (WebM)", "វីដេអូដកផ្ទៃ (WebM)")}
                </div>
                <div className="mt-1 text-lg font-semibold text-[var(--gold)]">{fmtSize(resultSize)}</div>
              </div>
              <a
                href={resultUrl}
                download="green-screen.webm"
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:opacity-90"
              >
                <Download size={13} />
                {t("Download WebM", "ទាញយក WebM")} — {fmtSize(resultSize)}
              </a>
            </>
          )}

          <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t(
              "Each frame is chroma-keyed per pixel (green distance vs tolerance and softness, with optional spill suppression) and composed over your background, then re-encoded to WebM with MediaRecorder. The audio track is not carried into the output.",
              "ស៊ុមនីមួយៗត្រូវបានដកផ្ទៃតាមភីកសែល (ភាពខុសពណ៌បៃតងធៀបនឹងកម្រិតអត់ធ្មត់ និងភាពទន់ ជាមួយការបង្ក្រាបការលេចពណ៌តាមតម្រូវការ) រួចផ្សំលើផ្ទៃខាងក្រោយរបស់អ្នក បន្ទាប់មកបង្ហាប់ឡើងវិញជា WebM ជាមួយ MediaRecorder។ ផ្នែកសំឡេងមិនត្រូវបានបញ្ចូលក្នុងលទ្ធផលទេ។"
            )}
          </p>
        </>
      )}
    </ToolShell>
  );
}
