"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Mic, VideoOff } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

export default function WebcamMicTest() {
  const { text: t } = useLanguage();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [camId, setCamId] = useState("");
  const [micId, setMicId] = useState("");
  const [live, setLive] = useState(false);
  const [level, setLevel] = useState(0);
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);

  const listDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((d) => d.kind === "videoinput" || d.kind === "audioinput"));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    listDevices();
  }, [listDevices]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setLive(false);
    setLevel(0);
    setResolution("");
  }, []);

  useEffect(() => () => stop(), [stop]);

  async function start() {
    setError("");
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: camId ? { deviceId: { exact: camId } } : true,
        audio: micId ? { deviceId: { exact: micId } } : true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      const settings = stream.getVideoTracks()[0]?.getSettings();
      if (settings?.width) setResolution(`${settings.width} × ${settings.height}`);
      const actx = new AudioContext();
      ctxRef.current = actx;
      const analyser = actx.createAnalyser();
      analyser.fftSize = 512;
      actx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
        setLevel(Math.min(100, Math.round((peak / 128) * 100)));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      setLive(true);
      listDevices();
    } catch {
      setError(t("Could not access the camera or microphone. Check browser permissions.", "មិនអាចចូលប្រើកាមេរ៉ា ឬមីក្រូហ្វូនបានទេ។ សូមពិនិត្យការអនុញ្ញាតកម្មវិធីរុករក។"));
    }
  }

  const cams = devices.filter((d) => d.kind === "videoinput");
  const mics = devices.filter((d) => d.kind === "audioinput");

  return (
    <ToolShell
      title="Webcam & Microphone Test"
      khmerTitle="ពិសោធន៍កាមេរ៉ា និងមីក្រូហ្វូន"
      description="Test your camera and microphone — live preview, resolution, and input level meter."
      descriptionKm="សាកល្បងកាមេរ៉ា និងមីក្រូហ្វូនរបស់អ្នក — មើលផ្ទាល់ គុណភាពបង្ហាញ និងកម្រិតសំឡេង។"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Camera", "កាមេរ៉ា")}</div>
            <select value={camId} onChange={(e) => setCamId(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]">
              <option value="">{t("Default camera", "កាមេរ៉ាលំនាំដើម")}</option>
              {cams.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `${t("Camera", "កាមេរ៉ា")} ${i + 1}`}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Microphone", "មីក្រូហ្វូន")}</div>
            <select value={micId} onChange={(e) => setMicId(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]">
              <option value="">{t("Default microphone", "មីក្រូហ្វូនលំនាំដើម")}</option>
              {mics.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `${t("Microphone", "មីក្រូហ្វូន")} ${i + 1}`}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--ground-line)] bg-black">
          <video ref={videoRef} muted playsInline className={`aspect-video w-full object-cover ${live ? "" : "hidden"}`} />
          {!live && (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 text-gray-500">
              <VideoOff size={36} />
              <span className="text-xs">{t("Camera preview appears here", "កាមេរ៉ានឹងបង្ហាញនៅទីនេះ")}</span>
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="flex items-center justify-between text-xs text-[var(--ink-dim)]">
            <span className="inline-flex items-center gap-1.5"><Mic size={13} />{t("Microphone level", "កម្រិតសំឡេង")}</span>
            <span className="font-mono-ui">{level}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--ground)]">
            <div className="h-full rounded-full bg-[var(--teal)] transition-all" style={{ width: `${level}%` }} />
          </div>
          {resolution && <div className="flex items-center gap-1.5 text-xs text-[var(--ink-faint)]"><Camera size={13} />{resolution}</div>}
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={start} className="flex-1 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40">
            {live ? t("Restart", "ចាប់ផ្តើមឡើងវិញ") : t("Start test", "ចាប់ផ្តើមសាកល្បង")}
          </button>
          {live && (
            <button type="button" onClick={stop} className="rounded-xl border border-[var(--ground-line)] px-5 py-3 text-sm font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)]">
              {t("Stop", "បញ្ឈប់")}
            </button>
          )}
        </div>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <p className="text-xs text-[var(--ink-faint)]">{t("Everything runs locally — no video or audio leaves your device.", "ដំណើរការក្នុងឧបករណ៍ទាំងស្រុង — វីដេអូ ឬសំឡេងមិនចេញពីឧបករណ៍អ្នកទេ។")}</p>
      </div>
    </ToolShell>
  );
}