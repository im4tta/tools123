"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import JSZip from "jszip";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

export default function VideoFrameBatch() {
  const { text: t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [interval, setIntervalSec] = useToolState("vfb:interval", "1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [frames, setFrames] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  function onFile(f: File | null) {
    if (!f) return;
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(f);
    setFileUrl(URL.createObjectURL(f));
    setFrames([]);
    setReady(false);
    setError("");
  }

  async function grab() {
    if (!file || !fileUrl) return;
    const intervalSec = Math.max(0.1, Number(interval) || 1);
    setBusy(true);
    setError("");
    setFrames([]);
    setReady(false);
    try {
      const video = document.createElement("video");
      video.src = fileUrl;
      video.muted = true;
      video.preload = "auto";
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error(t("Could not read the video.", "មិនអាចអានវីដេអូបានទេ។")));
      });
      const dur = video.duration;
      const canvas = document.createElement("canvas");
      const out: string[] = [];
      for (let time = 0; time <= dur; time += intervalSec) {
        await seekTo(video, time);
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        out.push(canvas.toDataURL("image/jpeg", 0.9));
        setFrames([...out]);
      }
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setBusy(false);
    }
  }

  function seekTo(video: HTMLVideoElement, sec: number): Promise<void> {
    return new Promise((resolve) => {
      const onSeeked = () => { video.removeEventListener("seeked", onSeeked); resolve(); };
      video.addEventListener("seeked", onSeeked);
      video.currentTime = sec;
    });
  }

  async function downloadZip() {
    const zip = new JSZip();
    frames.forEach((dataUrl, i) => {
      const base64 = dataUrl.split(",")[1];
      zip.file(`frame-${String(i + 1).padStart(3, "0")}.jpg`, base64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(file?.name || "video").replace(/\.[^.]+$/, "")}-frames.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <ToolShell
      title="Video Frame Batch"
      khmerTitle="ទាញរូបភាពពីវីដេអូតាមចន្លោះ"
      description="Extract a frame every N seconds from a video and download all the frames as a ZIP — entirely in your browser."
      descriptionKm="ទាញយករូបភាពមួយសន្លឹករៀងរាល់ N វិនាទីពីវីដេអូ ហើយនាំចេញទាំងអស់ជា ZIP — ដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករក។"
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{file ? file.name : t("Click to choose a video file", "ចុចដើម្បីជ្រើសរើសឯកសារវីដេអូ")}</span>
        <input type="file" accept="video/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </label>

      <Field label={t("Frame interval (seconds)", "ចន្លោះរូបភាព (វិនាទី)")}>
        <TextInput value={interval} onChange={(e) => setIntervalSec(e.target.value)} className="w-28 font-mono-ui" inputMode="decimal" />
      </Field>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="flex flex-wrap items-end gap-3">
        <Button onClick={grab} disabled={!file || busy}>
          {busy ? t("Extracting…", "កំពុងទាញ…") : t("Extract frames", "ទាញរូបភាព")}
        </Button>
        {ready && frames.length > 0 && (
          <Button onClick={downloadZip}>
            <Download size={15} className="mr-1 inline" />
            {t("Download ZIP", "ទាញយក ZIP")} ({frames.length})
          </Button>
        )}
      </div>

      {frames.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-[var(--ink-dim)]">{t(`${frames.length} frames`, `${frames.length} រូបភាព`)}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {frames.map((f, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={f} alt={`frame ${i + 1}`} className="aspect-video w-full rounded-md border border-[var(--ground-line)] object-cover" />
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
        {t("Frames are captured by seeking the video locally and drawn to a canvas — nothing leaves your browser.", "រូបភាពត្រូវបានចាប់យកដោយការស្វែងរកវីដេអូក្នុងម៉ាស៊ីន និងគូរទៅក្នុង canvas — គ្មានអ្វីចាកចេញពីកម្មវិធីរុករកឡើយ។")}
      </p>
    </ToolShell>
  );
}
