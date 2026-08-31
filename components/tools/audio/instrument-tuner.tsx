"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

type TunerStatus = "idle" | "requesting" | "active" | "error";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Autocorrelation pitch detection on a time-domain buffer (no external lib). */
function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
  if (Math.sqrt(rms / buffer.length) < 0.01) return null; // silence gate

  const minLag = Math.floor(sampleRate / 2000); // up to 2 kHz
  const maxLag = Math.floor(sampleRate / 50); // down to 50 Hz
  let bestLag = -1;
  let bestCorr = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    let energy = 0;
    for (let i = 0; i + lag < buffer.length; i++) {
      sum += buffer[i] * buffer[i + lag];
      energy += buffer[i + lag] * buffer[i + lag];
    }
    if (energy === 0) continue;
    const corr = sum / energy;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }
  if (bestLag <= 0 || bestCorr < 0.6) return null;
  return sampleRate / bestLag;
}

export default function InstrumentTuner() {
  const { text: t } = useLanguage();
  const [status, setStatus] = useState<TunerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [freq, setFreq] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [cents, setCents] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    analyserRef.current = null;
    setStatus("idle");
    setFreq(null);
    setNote(null);
    setCents(0);
  };

  const start = async () => {
    setStatus("requesting");
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(t("Microphone input is not supported in this browser.", "ការបញ្ចូលមីក្រូហ្វូនមិនត្រូវបានគាំទ្រក្នុងកម្មវិធីរុករកនេះទេ។"));
        setStatus("error");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      streamRef.current = stream;
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      setStatus("active");
      timerRef.current = setInterval(() => {
        const a = analyserRef.current;
        const c = ctxRef.current;
        if (!a || !c) return;
        const buf = new Float32Array(a.fftSize);
        a.getFloatTimeDomainData(buf);
        const f = detectPitch(buf, c.sampleRate);
        if (f) {
          const midi = 69 + 12 * Math.log2(f / 440); // A4 = 440 Hz
          const nearest = Math.round(midi);
          const name = NOTE_NAMES[((nearest % 12) + 12) % 12] + (Math.floor(nearest / 12) - 1);
          setFreq(f);
          setNote(name);
          setCents(Math.round((midi - nearest) * 100));
        }
      }, 120);
    } catch {
      setError(
        t(
          "Microphone access was denied or failed. Allow microphone permission in your browser and try again.",
          "ការចូលប្រើមីក្រូហ្វូនត្រូវបានបដិសេធ ឬបរាជ័យ។ សូមអនុញ្ញាតសិទ្ធិមីក្រូហ្វូនក្នុងកម្មវិធីរុករករបស់អ្នក រួចព្យាយាមម្ដងទៀត។"
        )
      );
      setStatus("error");
    }
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    void ctxRef.current?.close();
  }, []);

  const clampedCents = Math.max(-50, Math.min(50, cents));
  const needleLeft = 50 + (clampedCents / 50) * 50;
  const inTune = Math.abs(cents) <= 5;

  return (
    <ToolShell
      title="Instrument Tuner"
      khmerTitle="ឧបករណ៍លៃសំឡេង"
      description="Detect the pitch of a nearby instrument or voice with your microphone and tune against the nearest note — all processing stays in your browser."
      descriptionKm="ស្វែងរកសំឡេងរបស់ឧបករណ៍ភ្លេង ឬសំឡេងនៅក្បែរដោយប្រើមីក្រូហ្វូន រួចលៃតម្រឹមជាមួយសំឡេងដែលនៅជិតបំផុត — ដំណើរការទាំងអស់ស្ថិតក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      {status === "idle" && (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center">
          <p className="text-sm leading-relaxed text-[var(--ink-dim)]">
            {t(
              "Allow microphone access to start tuning. Play a single note on your instrument and the tuner shows the closest note and how many cents it is off.",
              "អនុញ្ញាតសិទ្ធិមីក្រូហ្វូនដើម្បីចាប់ផ្ដើមលៃសំឡេង។ លេងសំឡេងតែមួយលើឧបករណ៍របស់អ្នក ហើយឧបករណ៍នឹងបង្ហាញសំឡេងដែលនៅជិតបំផុត និងចំនួនសេនដែលខុសគ្នា។"
            )}
          </p>
          <Button type="button" onClick={() => void start()} className="mt-4">
            <Mic size={15} className="mr-1 inline" />
            {t("Start tuning", "ចាប់ផ្ដើមលៃសំឡេង")}
          </Button>
        </div>
      )}

      {status === "requesting" && (
        <p className="text-sm text-[var(--ink-dim)]">
          {t("Requesting microphone access…", "កំពុងស្នើសុំសិទ្ធិមីក្រូហ្វូន…")}
        </p>
      )}

      {status === "error" && (
        <div className="rounded-md border border-[var(--danger)]/50 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
          <p>{error}</p>
          <Button type="button" onClick={() => void start()} className="mt-3">
            <Mic size={15} className="mr-1 inline" />
            {t("Try again", "ព្យាយាមម្ដងទៀត")}
          </Button>
        </div>
      )}

      {status === "active" && (
        <>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 text-center">
            <div className="font-display text-5xl font-semibold text-[var(--ink)]">{note ?? "—"}</div>
            <div className="mt-2 text-sm text-[var(--ink-dim)]">
              {t("Frequency", "ប្រេកង់")}: {freq ? `${freq.toFixed(1)} Hz` : "—"}
            </div>
            <div className={`mt-1 text-sm font-medium ${inTune ? "text-[var(--gold)]" : "text-[var(--danger)]"}`}>
              {freq
                ? `${cents > 0 ? "+" : ""}${cents} ${t("cents", "សេន")}`
                : t("Playing…", "កំពុងលេង…")}
            </div>
            <div className="relative mx-auto mt-4 h-14 max-w-sm rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[var(--ground-line)]" />
              <div
                className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                  inTune ? "bg-[var(--gold)]" : "bg-[var(--danger)]"
                }`}
                style={{ left: `${needleLeft}%` }}
              />
            </div>
            <div className="mx-auto mt-1 flex max-w-sm justify-between text-[10px] text-[var(--ink-dim)]">
              <span>-50</span>
              <span>0</span>
              <span>+50</span>
            </div>
          </div>
          <Button type="button" onClick={stop} className="w-full">
            <MicOff size={15} className="mr-1 inline" />
            {t("Stop tuning", "បញ្ឈប់ការលៃសំឡេង")}
          </Button>
        </>
      )}

      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Pitch is detected with an autocorrelation algorithm running directly on the microphone stream (A4 = 440 Hz). Audio never leaves your device.",
          "សំឡេងត្រូវបានរកឃើញដោយក្បួនដោះស្រាយ autocorrelation ដំណើរការដោយផ្ទាល់លើស្ទ្រីមមីក្រូហ្វូន (A4 = 440 Hz)។ សំឡេងមិនដែលចាកចេញពីឧបករណ៍របស់អ្នកឡើយ។"
        )}
      </p>
    </ToolShell>
  );
}
