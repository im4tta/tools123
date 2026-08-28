"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { downloadSeconds, megabytesPerMinute, SIZE_UNITS, SPEED_UNITS } from "@/lib/calc/net";

export default function DownloadTimeCalculator() {
  const { text: t } = useLanguage();
  const [sizeValue, setSizeValue] = useToolState("dl:size", "700");
  const [sizeUnit, setSizeUnit] = useToolState("dl:sizeUnit", "MB");
  const [speedValue, setSpeedValue] = useToolState("dl:speed", "50");
  const [speedUnit, setSpeedUnit] = useToolState("dl:speedUnit", "Mbit/s");

  const result = useMemo(() => {
    const seconds = downloadSeconds(Number(sizeValue), sizeUnit, Number(speedValue), speedUnit);
    const perMinute = megabytesPerMinute(Number(speedValue), speedUnit);
    return { seconds, perMinute };
  }, [sizeValue, sizeUnit, speedValue, speedUnit]);

  const humanize = (secs: number) => {
    if (!isFinite(secs) || secs <= 0) return "—";
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.round(secs % 60);
    const parts: string[] = [];
    if (d > 0) parts.push(t(`${d} day${d === 1 ? "" : "s"}`, `${d} ថ្ងៃ`));
    if (h > 0) parts.push(t(`${h} hour${h === 1 ? "" : "s"}`, `${h} ម៉ោង`));
    if (m > 0) parts.push(t(`${m} minute${m === 1 ? "" : "s"}`, `${m} នាទី`));
    if (s > 0 || parts.length === 0) parts.push(t(`${s} second${s === 1 ? "" : "s"}`, `${s} វិនាទី`));
    return parts.slice(0, 3).join(" ");
  };

  const seconds = result.seconds;

  return (
    <ToolShell
      title="Download Time Calculator"
      khmerTitle="គណនាពេលទាញយក"
      description="How long a file takes to transfer at a given link speed — with decimal (MB) vs binary (MiB) and Mbit/s vs MB/s handled correctly."
      descriptionKm="ឯកសារមួយចំណាយពេលប៉ុន្មានដើម្បីទាញយកតាមល្បឿនបណ្តាញ — ដោយបែងចែក MB (ទស្សនិក) និង MiB (គោលពីរ) និង Mbit/s និង MB/s ត្រឹមត្រូវ។"
    >
      <Row>
        <Field label={t("File size", "ទំហំឯកសារ")}>
          <TextInput type="number" step="any" min="0" value={sizeValue} onChange={(e) => setSizeValue(e.target.value)} />
        </Field>
        <Field label={t("Size unit", "ឯកតាទំហំ")}>
          <Select value={sizeUnit} onChange={(e) => setSizeUnit(e.target.value)}>
            {Object.keys(SIZE_UNITS).map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
        </Field>
      </Row>
      <Row>
        <Field label={t("Link speed", "ល្បឿនបណ្តាញ")}>
          <TextInput type="number" step="any" min="0" value={speedValue} onChange={(e) => setSpeedValue(e.target.value)} />
        </Field>
        <Field label={t("Speed unit", "ឯកតាល្បឿន")}>
          <Select value={speedUnit} onChange={(e) => setSpeedUnit(e.target.value)}>
            {Object.keys(SPEED_UNITS).map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
        </Field>
      </Row>

      {seconds !== null ? (
        <div className="space-y-2">
          <Output label={t("Estimated download time", "ពេលទាញយកប៉ាន់ស្មាន")} value={humanize(seconds)} />
          <Output label={t("Exact seconds", "វិនាទីពិតប្រាកដ")} value={seconds.toLocaleString(undefined, { maximumFractionDigits: 2 })} />
          {result.perMinute !== null && (
            <Output label={t("Throughput context", "បរិវេណភាពបរិបទ")} value={t(`≈ ${result.perMinute.toLocaleString(undefined, { maximumFractionDigits: 1 })} MB per minute`, `≈ ${result.perMinute.toLocaleString(undefined, { maximumFractionDigits: 1 })} MB ក្នុងមួយនាទី`)} />
          )}
        </div>
      ) : (
        <Output label={t("Status", "ស្ថានភាព")} value={t("Enter a positive file size and link speed.", "សូមបញ្ចូលទំហំឯកសារ និងល្បឿនជាលេខវិជ្ជមាន។")} error />
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t("Formula: time = file bits ÷ link bits per second. kB/MB/GB are powers of 1000; KiB/MiB/GiB are powers of 1024. Real-world transfers are slower than this ideal (protocol overhead, Wi-Fi, shared links), so treat it as a best case.", "រូបមន្ត៖ ពេល = ប៊ីតឯកសារ ÷ ល្បឿនបណ្តាញ (bit/s)។ kB/MB/GB ជាដឺក្រេ ១០០០; KiB/MiB/GiB ជាដឺក្រេ ១០២៤។ ការទាញយកពិតប្រាកដយឺតជាងនេះ (បញ្ជាក់ពី protocols, Wi-Fi, បណ្តាញចែករំលែក) ដូច្នេះចាត់ទុកជាករណីល្អបំផុត។")}
      </p>
    </ToolShell>
  );
}
