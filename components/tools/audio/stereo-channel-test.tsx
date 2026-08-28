"use client";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Channel = "left" | "right" | "both" | "sweep";
type Wave = "sine" | "noise";

export default function StereoChannelTest() {
  const { text: t } = useLanguage();
  const [wave, setWave] = useToolState<Wave>("stereo:wave", "sine");
  const [volume, setVolume] = useToolState("stereo:volume", "0.4");
  const [channel, setChannel] = useState<Channel | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ source: AudioScheduledSourceNode; panner: StereoPannerNode; gain: GainNode } | null>(null);
  const sweepRef = useRef<number | null>(null);

  const stop = () => {
    if (sweepRef.current !== null) { window.clearInterval(sweepRef.current); sweepRef.current = null; }
    if (nodesRef.current) {
      try { nodesRef.current.source.stop(); } catch { /* already stopped */ }
      nodesRef.current = null;
    }
    channelRef.current = null;
    setChannel(null);
  };

  // Keep the latest stop()/play() in refs so effects never capture stale closures.
  const stopRef = useRef(stop);
  const playRef = useRef<(next: Channel) => void>(() => {});
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    stopRef.current = stop;
    playRef.current = (next: Channel) => play(next);
  });

  useEffect(() => () => { stopRef.current(); }, []);

  // Re-apply the new signal type/volume while a channel is playing.
  useEffect(() => {
    if (channelRef.current) playRef.current(channelRef.current);
  }, [wave, volume]);

  function play(next: Channel) {
    stop();
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = ctxRef.current ?? new Ctx();
    ctxRef.current = ctx;
    void ctx.resume();

    const gain = ctx.createGain();
    gain.gain.value = Math.min(1, Math.max(0, Number(volume) || 0));
    const panner = ctx.createStereoPanner?.();
    let source: AudioScheduledSourceNode;

    if (wave === "noise") {
      const length = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      const bufferSource = ctx.createBufferSource();
      bufferSource.buffer = buffer;
      bufferSource.loop = true;
      source = bufferSource;
    } else {
      const oscillator = ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = 440;
      source = oscillator;
    }

    if (panner) {
      source.connect(panner);
      panner.connect(gain);
      if (next === "left") { panner.pan.value = -1; }
      else if (next === "right") { panner.pan.value = 1; }
      else if (next === "sweep") {
        panner.pan.value = -1;
        sweepRef.current = window.setInterval(() => {
          panner.pan.value = Math.sin(Date.now() / 600) * 0.95;
        }, 60);
      } else panner.pan.value = 0;
    } else {
      // No StereoPanner support: play a mono fallback in both channels.
      source.connect(gain);
    }
    gain.connect(ctx.destination);
    source.start();
    nodesRef.current = { source, panner, gain };
    channelRef.current = next;
    setChannel(next);
  }

  const button = (id: Channel, en: string, km: string, active?: string) => (
    <button
      key={id}
      type="button"
      onClick={() => (channel === id ? stop() : play(id))}
      className={`rounded-md border px-4 py-2.5 text-sm font-medium transition ${channel === id ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)] hover:border-[var(--gold-dim)]"}`}
    >
      {channel === id && <VolumeX size={14} className="mr-1.5 inline" />}
      {channel !== id && <Volume2 size={14} className="mr-1.5 inline" />}
      {t(en, km)}{active ? ` · ${active}` : ""}
    </button>
  );

  return (
    <ToolShell
      title="Stereo Channel Test"
      khmerTitle="សាកល្បងសំឡេងឆានែល"
      description="Check left/right speaker balance with a 440 Hz tone or noise panned hard left, hard right, both, or a sweeping pan — generated entirely in your browser."
      descriptionKm="ពិនិត្យតុល្យភាពសំឡេងឆ្វេង/ស្តាំ ជាមួយសំឡេង 440 Hz ឬសម្លេងរំខាន បញ្ចេញពីឆ្វេង ស្តាំ ទាំងពីរ ឬរំកិលឆ្លាស់ — បង្កើតក្នុងកម្មវិធីរុករករបស់អ្នកទាំងស្រុង។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("Signal", "សញ្ញា")}>
          <Select value={wave} onChange={(e) => setWave(e.target.value as Wave)}>
            <option value="sine">{t("Tone (440 Hz)", "សំឡេងបន្ទរ (440 Hz)")}</option>
            <option value="noise">{t("Noise (broadband)", "សម្លេងរំខាន (គ្រប់ប្រេកង់)")}</option>
          </Select>
        </Field>
        <Field label={t("Volume (0–1)", "កម្រិតសំឡេង (0–1)")}>
          <input
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)] focus:ring-1 focus:ring-[var(--gold-dim)]"
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        {button("left", "Left channel", "ឆានែលឆ្វេង", channel === "left" ? t("playing", "កំពុងលេង") : undefined)}
        {button("right", "Right channel", "ឆានែលស្តាំ", channel === "right" ? t("playing", "កំពុងលេង") : undefined)}
        {button("both", "Both channels", "ទាំងពីរឆានែល", channel === "both" ? t("playing", "កំពុងលេង") : undefined)}
        {button("sweep", "Sweep L → R", "រំកិល ឆ្វេង → ស្តាំ", channel === "sweep" ? t("playing", "កំពុងលេង") : undefined)}
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t("Use a wired headset or your phone/tablet speakers and listen: with “Left” the sound should come from the left only, and vice versa. “Sweep” moves a continuous tone between the channels. Audio is generated with the Web Audio API on your device and is not recorded or transmitted anywhere.", "ប្រើខ្សែកាបូណា ឬស្ពីកករទូរសព្ទ/ថេប្លេត ហើយស្តាប់៖ ជាមួយ “ឆ្វេង” សំឡេងគួរចេញតែពីឆ្វេង ហើយបញ្ច្រាស់វិញ។ “រំកិល” ផ្លាស់សំឡេងរវាងឆានែលទាំងពីរ។ សំឡេងបង្កើតតាម Web Audio API លើឧបករណ៍របស់អ្នក មិនត្រូវបានកត់ត្រា ឬបញ្ជូនទេ។")}
      </p>
    </ToolShell>
  );
}
