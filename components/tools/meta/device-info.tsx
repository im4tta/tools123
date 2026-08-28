"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ToolShell, Field } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

interface Row { en: string; km: string; value: string }
interface BatteryLike { level: number; charging: boolean }
interface ConnectionLike { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean }

export default function DeviceInfo() {
  const { text: t } = useLanguage();
  const [battery, setBattery] = useState<BatteryLike | null>(null);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [online, setOnline] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Browser globals (navigator/screen/window) only exist in the browser —
  // gate everything behind `mounted` so server-side rendering never touches them.
  useEffect(() => setMounted(true), []); // eslint-disable-line react-hooks/set-state-in-effect

  const refresh = useCallback(() => {
    setOnline(navigator.onLine);
    setBattery(null);
    setStorage(null);
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryLike & { addEventListener: (type: string, fn: () => void) => void }> };
    nav.getBattery?.().then((b) => {
      setBattery({ level: b.level, charging: b.charging });
      b.addEventListener?.("levelchange", () => setBattery({ level: b.level, charging: b.charging }));
      b.addEventListener?.("chargingchange", () => setBattery({ level: b.level, charging: b.charging }));
    }).catch(() => setBattery(null));
    navigator.storage?.estimate?.().then((est) => {
      if (typeof est.usage === "number" && typeof est.quota === "number") setStorage({ usage: est.usage, quota: est.quota });
    }).catch(() => setStorage(null));
  }, []);

  useEffect(() => {
    refresh(); // eslint-disable-line react-hooks/set-state-in-effect
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, [refresh]);

  const gb = (bytes?: number) => (bytes === undefined ? "—" : `${(bytes / 1024 ** 3).toFixed(2)} GB`);
  const mb = (bytes?: number) => (bytes === undefined ? "—" : `${(bytes / 1024 ** 2).toFixed(1)} MB`);

  const rows: Row[] = useMemo(() => {
    if (!mounted) return [];
    const nav = navigator as Navigator & { userAgentData?: { platform?: string }; deviceMemory?: number; connection?: ConnectionLike };
    const conn = nav.connection;
    return [
      { en: "Browser / engine", km: "កម្មវិធីរុករក", value: nav.userAgent },
      { en: "Platform", km: "ប្លាតហ្វម", value: nav.userAgentData?.platform ?? nav.platform ?? "—" },
      { en: "Language(s)", km: "ភាសា", value: nav.languages?.join(", ") ?? nav.language ?? "—" },
      { en: "CPU threads", km: "ស្នូល CPU", value: nav.hardwareConcurrency ? String(nav.hardwareConcurrency) : t("Not exposed", "មិនបង្ហាញ") },
      { en: "Device memory", km: "អង្គចងចាំឧបករណ៍", value: nav.deviceMemory ? `≥ ${nav.deviceMemory} GB` : t("Not exposed", "មិនបង្ហាញ") },
      { en: "Screen", km: "អេក្រង់", value: `${screen.width} × ${screen.height} @ ${window.devicePixelRatio}x, ${screen.colorDepth}-bit` },
      { en: "Available screen", km: "អេក្រង់ដែលអាចប្រើ", value: `${screen.availWidth} × ${screen.availHeight}` },
      { en: "Viewport", km: "ទំហំផ្ទាំងមើល", value: `${window.innerWidth} × ${window.innerHeight}` },
      { en: "Touch points", km: "ចំណុចប៉ះ", value: String(nav.maxTouchPoints ?? 0) },
      { en: "Online", km: "តភ្ជាប់", value: online ? t("Yes", "បាទ/ចាស") : t("No (offline)", "ទេ (ក្រៅបណ្តាញ)") },
      { en: "Connection", km: "ការតភ្ជាប់", value: conn?.effectiveType ? `${conn.effectiveType}${conn.downlink !== undefined ? `, ~${conn.downlink} Mbit/s` : ""}${conn.rtt !== undefined ? `, RTT ${conn.rtt} ms` : ""}${conn.saveData ? t(", data saver on", ", សន្សំទិន្នន័យ") : ""}` : t("Not exposed", "មិនបង្ហាញ") },
      { en: "Battery", km: "ថ្ម", value: battery ? `${Math.round(battery.level * 100)}%${battery.charging ? t(" (charging)", " (កំពុងសាក)") : ""}` : t("Not exposed", "មិនបង្ហាញ") },
      { en: "Time zone", km: "តំបន់ពេលវេលា", value: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "—" },
      { en: "Cookies enabled", km: "Cookies បើក", value: nav.cookieEnabled ? t("Yes", "បាទ/ចាស") : t("No", "ទេ") },
      { en: "Storage used", km: "កន្លែងផ្ទុកបានប្រើ", value: storage ? `${mb(storage.usage)} / ${gb(storage.quota)}` : t("Not exposed", "មិនបង្ហាញ") },
    ];
  }, [mounted, battery, storage, online, t]);

  const sampleTip = mounted ? t("Read from this browser on", "អានពីកម្មវិធីរុករកនេះនៅ") : "";

  return (
    <ToolShell
      title="Device Info"
      khmerTitle="ព័ត៌មានឧបករណ៍"
      description="What this browser and device expose: screen, CPU, memory, network, battery, timezone, and storage — read locally, nothing is sent anywhere."
      descriptionKm="អ្វីដែលកម្មវិធីរុករក និងឧបករណ៍បង្ហាញ៖ អេក្រង់ CPU អង្គចងចាំ បណ្តាញ ថ្ម តំបន់ពេលវេលា និងកន្លែងផ្ទុក — អានក្នុងមូលដ្ឋាន មិនបញ្ជូនទៅណាទេ។"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--ink-dim)]">{sampleTip}</p>
        <button type="button" onClick={refresh} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs font-medium text-[var(--ink-dim)] transition hover:text-[var(--ink)]">
          <RefreshCw size={13} /> {t("Refresh", "ធ្វើឡើងវិញ")}
        </button>
      </div>

      {mounted ? (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {rows.map((row) => (
            <Field key={row.en} label={t(row.en, row.km)}>
              <div className="break-all rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]">
                {row.value}
              </div>
            </Field>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--ink-faint)]">{t("Reading device information…", "កំពុងអានព័ត៌មានឧបករណ៍…")}</p>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t("Everything on this page comes from standard browser APIs on your own device. Browsers deliberately hide or approximate some values (battery, memory, connection quality) for privacy; “Not exposed” means this browser does not share that value.", "ទិន្នន័យទាំងអស់មកពី APIs ស្តង់ដារលើឧបករណ៍របស់អ្នក។ កម្មវិធីរុករកលាក់ ឬបង្ហាញប្រហាក់ប្រហែលតម្លៃមួយចំនួន (ថ្ម អង្គចងចាំ គុណភាពបណ្តាញ) ដើម្បីភាពឯកជន; “មិនបង្ហាញ” មានន័យថាកម្មវិធីរុករកនេះមិនចែករំលែកតម្លៃនោះទេ។")}
      </p>
    </ToolShell>
  );
}

