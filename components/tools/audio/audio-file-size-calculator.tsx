"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const CHANNELS = [
  { value: "1", label: "Mono (1)", labelKm: "Mono (1)" },
  { value: "2", label: "Stereo (2)", labelKm: "Stereo (2)" },
  { value: "6", label: "5.1 surround (6)", labelKm: "5.1 surround (6)" },
];

const SAMPLE_RATES = [
  { value: "off", label: "Not set", labelKm: "មិនកំណត់" },
  { value: "44100", label: "44.1 kHz", labelKm: "44.1 kHz" },
  { value: "48000", label: "48 kHz", labelKm: "48 kHz" },
  { value: "88200", label: "88.2 kHz", labelKm: "88.2 kHz" },
  { value: "96000", label: "96 kHz", labelKm: "96 kHz" },
];

const UNIT_OPTIONS = [
  { value: "sec", label: "Seconds", labelKm: "វិនាទី" },
  { value: "min", label: "Minutes", labelKm: "នាទី" },
];

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

export default function AudioFileSizeCalculator() {
  const { text: t } = useLanguage();
  const [bitrateStr, setBitrateStr] = useToolState("audio-file-size:bitrate", "192");
  const [durationStr, setDurationStr] = useToolState("audio-file-size:duration", "4");
  const [unit, setUnit] = useToolState("audio-file-size:unit", "min");
  const [channelsStr, setChannelsStr] = useToolState("audio-file-size:channels", "2");
  const [sampleRate, setSampleRate] = useToolState("audio-file-size:sampleRate", "44100");

  const rows = useMemo(() => {
    const bitrate = Math.max(8, Math.min(3200, Number(bitrateStr) || 128));
    const dur = Math.max(0.01, Number(durationStr) || 0);
    const durSec = dur * (unit === "min" ? 60 : 1);
    const channels = Number(channelsStr) || 2;
    const sr = Number(sampleRate) || 0;
    const atBitrate = ((bitrate * 1000) / 8) * durSec;
    const atTypical = ((192 * 1000) / 8) * durSec;
    const wav = sr > 0 ? sr * channels * 2 * durSec : 0;
    const out: { label: string; value: string }[] = [
      { label: t(`MP3 at ${bitrate} kbps`, `MP3 នៅ ${bitrate} kbps`), value: formatSize(atBitrate) },
      { label: t("MP3 at ≈192 kbps (typical)", "MP3 ≈192 kbps (ធម្មតា)"), value: formatSize(atTypical) },
    ];
    if (sr > 0) {
      out.push({ label: t("Uncompressed WAV/PCM (16-bit)", "WAV/PCM មិនបង្ហាប់ (16-bit)"), value: formatSize(wav) });
    }
    return out;
  }, [bitrateStr, durationStr, unit, channelsStr, sampleRate, t]);

  return (
    <ToolShell
      title="Audio File Size Calculator"
      khmerTitle="គណនាទំហំឯកសារសម្លេង"
      description="Estimate the size of a compressed MP3 file from its bitrate and duration, and compare it with uncompressed WAV/PCM alternatives."
      descriptionKm="ប៉ាន់ស្មានទំហំឯកសារ MP3 បង្ហាប់ពី bitrate និងរយៈពេល ហើយប្រៀបធៀបជាមួយ WAV/PCM មិនបង្ហាប់។"
    >
      <Row>
        <Field label={t("Bitrate (kbps)", "Bitrate (kbps)")} hint={t("Compressed audio", "សម្លេងបង្ហាប់")}>
          <TextInput inputMode="numeric" value={bitrateStr} onChange={(e) => setBitrateStr(e.target.value)} />
        </Field>
        <Field label={t("Duration", "រយៈពេល")}>
          <TextInput inputMode="decimal" value={durationStr} onChange={(e) => setDurationStr(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label={t("Duration unit", "ឯកតារយៈពេល")}>
          <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {UNIT_OPTIONS.map((u) => (
              <option key={u.value} value={u.value}>{t(u.label, u.labelKm)}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Channels", "ឆានែល")}>
          <Select value={channelsStr} onChange={(e) => setChannelsStr(e.target.value)}>
            {CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>{t(c.label, c.labelKm)}</option>
            ))}
          </Select>
        </Field>
      </Row>
      <Row>
        <Field
          label={t("Sample rate", "អត្រាគំរូ")}
          hint={t("Optional — needed for WAV/PCM", "ស្រេចចិត្ត — ត្រូវការសម្រាប់ WAV/PCM")}
        >
          <Select value={sampleRate} onChange={(e) => setSampleRate(e.target.value)}>
            {SAMPLE_RATES.map((s) => (
              <option key={s.value} value={s.value}>{t(s.label, s.labelKm)}</option>
            ))}
          </Select>
        </Field>
      </Row>

      <div>
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
          {t("Estimated file size", "ទំហំឯកសារប៉ាន់ស្មាន")}
        </div>
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center justify-between gap-3 px-3 py-2 text-sm ${i > 0 ? "border-t border-[var(--ground-line)]/60" : ""}`}
            >
              <span className="text-[var(--ink-dim)]">{row.label}</span>
              <span className="font-mono-ui font-medium text-[var(--gold)]">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Estimates use bitrate × duration for compressed audio and sample rate × channels × 16-bit for WAV/PCM. They ignore container overhead and variable bitrate, so real files vary — treat them as approximate.",
          "ការប៉ាន់ស្មានប្រើ bitrate × រយៈពេលសម្រាប់សម្លេងបង្ហាប់ និងអត្រាគំរូ × ឆានែល × 16-bit សម្រាប់ WAV/PCM។ វាមិនរាប់បញ្ចូល overhead របស់ container និង bitrate ប្រែប្រួលទេ ដូច្នេះឯកសារពិតអាចខុសគ្នា — ចាត់ទុកជាតម្លៃប្រហាក់ប្រហែល។"
        )}
      </p>
    </ToolShell>
  );
}
