"use client";
import { useEffect, useRef, useState } from "react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { recordExport } from "@/lib/export";

export default function WebcamPhotoBooth() {
  const { text: t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const [mirror, setMirror] = useToolState("webcam-booth:mirror", true);
  const [effect, setEffect] = useToolState("webcam-booth:effect", "none");
  const [shots, setShots] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function start() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t("This browser does not support camera access, or the page is not served over HTTPS/localhost.", "កម្មវិធីរុករកនេះមិនគាំទ្រការចូលប្រើកាមេរ៉ា ឬទំព័រមិនត្រូវបានបម្រើតាមរយៈ HTTPS/localhost ទេ។"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStarted(true);
    } catch {
      setError(t("Camera access was denied or the camera is unavailable. Check your browser permission and try again.", "ការចូលប្រើកាមេរ៉ាត្រូវបានបដិសេធ ឬកាមេរ៉ាមិនអាចប្រើបាន។ សូមពិនិត្យសិទ្ធិរបស់កម្មវិធីរុករក ហើយព្យាយាមម្ដងទៀត។"));
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStarted(false);
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (effect === "grayscale") ctx.filter = "grayscale(1)";
    if (effect === "sepia") ctx.filter = "sepia(1)";
    if (mirror) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    setShots((prev) => [canvas.toDataURL("image/png"), ...prev]);
  }

  function downloadShot(url: string, index: number) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `photo-booth-${index + 1}.png`;
    a.click();
    recordExport();
  }

  const videoFilter = effect === "grayscale" ? "grayscale(1)" : effect === "sepia" ? "sepia(1)" : "none";

  return (
    <ToolShell
      title="Webcam Photo Booth"
      khmerTitle="ថតរូបកាមេរ៉ា"
      description="Use your webcam to take photos right in the browser — with mirror preview and simple effects. Nothing is uploaded; everything stays on your device."
      descriptionKm="ប្រើកាមេរ៉ារបស់អ្នកដើម្បីថតរូបក្នុងកម្មវិធីរុករកផ្ទាល់ — ជាមួយការឆ្លុះកញ្ចក់ និងបែបផែនសាមញ្ញ។ គ្មានអ្វីត្រូវបានផ្ទុកឡើងទេ; អ្វីៗនៅលើឧបករណ៍របស់អ្នក។"
    >
      <div className="flex flex-wrap items-center gap-3">
        {started ? (
          <Button onClick={stop}>{t("Stop camera", "បិទកាមេរ៉ា")}</Button>
        ) : (
          <Button onClick={start}>{t("Start camera", "បើកកាមេរ៉ា")}</Button>
        )}
        <Button onClick={capture} disabled={!started}>{t("Capture photo", "ថតរូប")}</Button>
      </div>

      {error && <p className="rounded-md border border-[var(--danger)]/50 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">{error}</p>}

      {started && (
        <Row>
          <Field label={t("Mirror", "ឆ្លុះកញ្ចក់")}>
            <label className="flex h-9 items-center gap-2 text-sm text-[var(--ink)]">
              <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
              {t("Flip horizontally", "ត្រឡប់ផ្ដេក")}
            </label>
          </Field>
          <Field label={t("Effect", "បែបផែន")}>
            <Select value={effect} onChange={(e) => setEffect(e.target.value)}>
              <option value="none">{t("None", "គ្មាន")}</option>
              <option value="grayscale">{t("Grayscale", "ខ្មៅស")}</option>
              <option value="sepia">{t("Sepia", "Sepia")}</option>
            </Select>
          </Field>
        </Row>
      )}

      <div className="relative overflow-hidden rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`aspect-video w-full object-cover ${mirror ? "-scale-x-100" : ""}`}
          style={{ filter: videoFilter }}
        />
        {!started && (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-[var(--ink-dim)]">
            {t("Camera preview will appear here. Press “Start camera” to begin.", "ការមើលជាមុនពីកាមេរ៉ានឹងបង្ហាញនៅទីនេះ។ សូមចុច “បើកកាមេរ៉ា” ដើម្បីចាប់ផ្ដើម។")}
          </div>
        )}
      </div>

      {shots.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
            {t("Captured photos", "រូបថតដែលបានថត")} ({shots.length})
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {shots.map((shot, i) => (
              <div key={i} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot} alt={t("Captured photo", "រូបថត")} className="h-24 w-32 rounded-md border border-[var(--ground-line)] object-cover" />
                <button
                  type="button"
                  onClick={() => downloadShot(shot, i)}
                  className="mt-1 w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2 py-1 text-xs text-[var(--gold)] transition hover:border-[var(--gold-dim)]"
                >
                  {t("Download", "ទាញយក")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolShell>
  );
}
