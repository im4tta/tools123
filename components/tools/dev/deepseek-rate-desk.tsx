"use client";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Model = "flash" | "pro";
type Period = "auto" | "off" | "peak";

const PRICES: Record<Model, { hit: { off: number; peak: number }; miss: { off: number; peak: number }; out: { off: number; peak: number } }> = {
  flash: { hit: { off: 0.007, peak: 0.014 }, miss: { off: 0.22, peak: 0.44 }, out: { off: 0.66, peak: 1.32 } },
  pro: { hit: { off: 0.022, peak: 0.044 }, miss: { off: 0.66, peak: 1.32 }, out: { off: 1.98, peak: 3.96 } },
};

const MODELS: Record<Model, { name: string; sub: string; conc: string }> = {
  flash: { name: "v4-flash", sub: "DeepSeek-V4-Flash-0731 · 1M ctx · 384K max out", conc: "2500 conc." },
  pro: { name: "v4-pro", sub: "DeepSeek-V4-Pro-0813 · 1M ctx · 384K max out", conc: "500 conc." },
};

function isPeakUtc(hour: number): boolean {
  return (hour >= 1 && hour < 4) || (hour >= 6 && hour < 10);
}

function fmtMoney(n: number, currency: string): string {
  if (currency === "USD") return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 4 : 2 });
  return "៛" + Math.round(n).toLocaleString("en-US");
}

function Slider({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void }) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 text-xs text-[var(--ink-dim)]">{label}</div>
      <div className="flex items-center gap-3">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-1 flex-1 cursor-pointer accent-[var(--teal)]" />
        <span className="min-w-[68px] rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-1 text-right font-mono-ui text-xs text-[var(--ink)]">{display}</span>
      </div>
    </div>
  );
}

export default function DeepSeekRateDesk() {
  const { text: t } = useLanguage();
  const [model, setModel] = useToolState<Model>("deepseek-rate-desk:model", "flash");
  const [period, setPeriod] = useToolState<Period>("deepseek-rate-desk:period", "auto");
  const [inTok, setInTok] = useToolState("deepseek-rate-desk:inTok", 4000);
  const [outTok, setOutTok] = useToolState("deepseek-rate-desk:outTok", 1000);
  const [cacheHit, setCacheHit] = useToolState("deepseek-rate-desk:cacheHit", 30);
  const [reqCount, setReqCount] = useToolState("deepseek-rate-desk:reqCount", 1000);
  const [windowStr, setWindow] = useToolState("deepseek-rate-desk:window", "1");
  const [currency, setCurrency] = useToolState("deepseek-rate-desk:currency", "USD");

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
  const dateStr = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Phnom_Penh", weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(now);

  const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;
  const peak = isPeakUtc(now.getUTCHours());
  const currentPeriod: "peak" | "off" = period === "auto" ? (peak ? "peak" : "off") : period;

  const p = PRICES[model];
  const hitFrac = cacheHit / 100;
  const hitTokens = inTok * hitFrac;
  const missTokens = inTok * (1 - hitFrac);
  const costPerReq = (hitTokens / 1e6) * p.hit[currentPeriod] + (missTokens / 1e6) * p.miss[currentPeriod] + (outTok / 1e6) * p.out[currentPeriod];
  const windowMult = Number(windowStr);
  const totalCost = costPerReq * reqCount * windowMult;
  const totalTokens = (inTok + outTok) * reqCount * windowMult;
  const fxRate = currency === "KHR" ? 4100 : 1;

  const peakSegments: [number, number][] = [[1, 4], [6, 10]];

  return (
    <ToolShell
      title="DeepSeek V4 Rate Desk"
      khmerTitle="តារាងតម្លៃ DeepSeek V4"
      description="DeepSeek V4 API pricing with peak/off-peak windows and a token cost calculator."
      descriptionKm="តារាងតម្លៃ DeepSeek V4 API ជាមួយម៉ោងខ្ពស់/ទាប និងម៉ាស៊ីនគណនាថ្លៃ Token។"
    >
      {/* Clock */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
        <div>
          <div className="font-mono-ui text-4xl font-semibold tabular-nums text-[var(--ink)]">{timeStr}</div>
          <div className="mt-1 text-xs text-[var(--ink-dim)]">{dateStr} · Asia/Phnom_Penh (ICT, UTC+7)</div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono-ui text-xs font-medium ${peak ? "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--teal)]/40 bg-[var(--teal)]/10 text-[var(--teal)]"}`}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          {peak ? t("PEAK · 2x rates active", "ម៉ោងខ្ពស់ · អត្រា 2x កំពុងដំណើរការ") : t("OFF-PEAK · half-price rates active", "ម៉ោងទាប · អត្រាពាក់កណ្តាលកំពុងដំណើរការ")}
        </span>
      </div>

      {/* Timeline */}
      <div className="mb-4 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-[var(--ink)]">{t("Peak windows, in your local time", "ម៉ោងខ្ពស់ តាមពេលវេលាមូលដ្ឋាន")}</h2>
          <span className="text-xs text-[var(--ink-faint)]">UTC 01:00–04:00 & 06:00–10:00 → ICT 08:00–11:00 & 13:00–17:00</span>
        </div>
        <div className="relative h-9 overflow-hidden rounded-lg border border-[var(--ground-line)] bg-[var(--ground)]">
          {peakSegments.map(([a, b]) => (
            <span key={a} className="absolute bottom-0 top-0 bg-[var(--gold)]/20" style={{ left: `${(a / 24) * 100}%`, width: `${((b - a) / 24) * 100}%` }} />
          ))}
          <span className="absolute bottom-[-6px] top-[-6px] w-0.5 bg-[var(--teal)] transition-all" style={{ left: `${(utcHour / 24) * 100}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between font-mono-ui text-[10px] text-[var(--ink-faint)]">
          <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--ink-dim)]">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--gold)]/20" />{t("Peak (2x rate)", "ម៉ោងខ្ពស់ (អត្រា 2x)")}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--ground-line)]" />{t("Off-peak (1x rate)", "ម៉ោងទាប (អត្រា 1x)")}</span>
        </div>
      </div>

      {/* Model cards */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(Object.keys(MODELS) as Model[]).map((m) => (
          <div key={m} className={`rounded-xl border p-4 transition ${model === m ? "border-[var(--teal)] shadow-[0_0_0_1.5px_var(--teal)]" : "border-[var(--ground-line)]"} bg-[var(--ground-raised)]`}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-mono-ui text-sm font-semibold text-[var(--ink)]">{MODELS[m].name}</h3>
              <span className="rounded-md border border-[var(--ground-line)] bg-[var(--teal)]/10 px-2 py-0.5 font-mono-ui text-[10px] text-[var(--teal)]">{MODELS[m].conc}</span>
            </div>
            <div className="mb-2 text-xs text-[var(--ink-faint)]">{MODELS[m].sub}</div>
            <div className="divide-y divide-[var(--ground-line)] text-xs">
              <div className="flex justify-between py-1.5"><span className="text-[var(--ink-dim)]">{t("Input, cache hit", "បញ្ចូល បុកឃ្លាំង")}</span><span className="font-mono-ui font-medium text-[var(--ink)]">${PRICES[m].hit.off}</span></div>
              <div className="flex justify-between py-1.5"><span className="text-[var(--ink-dim)]">{t("Input, cache miss", "បញ្ចូល មិនបុកឃ្លាំង")}</span><span className="font-mono-ui font-medium text-[var(--ink)]">${PRICES[m].miss.off}</span></div>
              <div className="flex justify-between py-1.5"><span className="text-[var(--ink-dim)]">{t("Output", "លទ្ធផល")}</span><span className="font-mono-ui font-medium text-[var(--ink)]">${PRICES[m].out.off}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Calculator */}
      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
        <h2 className="mb-4 text-sm font-medium text-[var(--ink)]">{t("Cost calculator", "ម៉ាស៊ីនគណនាថ្លៃ")}</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {(Object.keys(MODELS) as Model[]).map((m) => (
            <button key={m} type="button" onClick={() => setModel(m)} className={`rounded-lg px-4 py-2 font-mono-ui text-xs transition ${model === m ? "bg-[var(--teal)] text-white" : "border border-[var(--ground-line)] bg-[var(--ground)] text-[var(--ink-dim)]"}`}>
              {MODELS[m].name}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {([["auto", "Auto (current ICT time)"], ["off", "Force off-peak"], ["peak", "Force peak"]] as [Period, string][]).map(([val, label]) => (
            <button key={val} type="button" onClick={() => setPeriod(val)} className={`rounded-lg px-4 py-2 font-mono-ui text-xs transition ${period === val ? "bg-[var(--teal)] text-white" : "border border-[var(--ground-line)] bg-[var(--ground)] text-[var(--ink-dim)]"}`}>
              {t(label, val === "auto" ? "ស្វ័យប្រវត្តិ (ម៉ោង ICT)" : val === "off" ? "បង្ខំម៉ោងទាប" : "បង្ខំម៉ោងខ្ពស់")}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          <div>
            <Slider label={t("Input tokens per request", "Token បញ្ចូលក្នុងមួយសំណើ")} value={inTok} min={0} max={200000} step={500} display={inTok.toLocaleString()} onChange={setInTok} />
            <Slider label={t("Output tokens per request", "Token លទ្ធផលក្នុងមួយសំណើ")} value={outTok} min={0} max={50000} step={250} display={outTok.toLocaleString()} onChange={setOutTok} />
            <Slider label={t("Cache hit rate on input", "អត្រាបុកឃ្លាំង")} value={cacheHit} min={0} max={100} step={5} display={`${cacheHit}%`} onChange={setCacheHit} />
          </div>
          <div>
            <Slider label={t("Requests", "ចំនួនសំណើ")} value={reqCount} min={1} max={100000} step={1} display={reqCount.toLocaleString()} onChange={setReqCount} />
            <div className="mb-4">
              <div className="mb-1.5 text-xs text-[var(--ink-dim)]">{t("Billing window", "រយៈពេលគិតថ្លៃ")}</div>
              <select value={windowStr} onChange={(e) => setWindow(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)]">
                <option value="1">{t("Per batch (as entered)", "ក្នុងមួយបាច់")}</option>
                <option value="30">{t("Projected monthly (×30)", "ប៉ាន់ប្រមាណប្រចាំខែ (×30)")}</option>
                <option value="365">{t("Projected yearly (×365)", "ប៉ាន់ប្រមាណប្រចាំឆ្នាំ (×365)")}</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="mb-1.5 text-xs text-[var(--ink-dim)]">{t("Convert to", "បម្លែងទៅ")}</div>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)]">
                <option value="USD">USD ($)</option>
                <option value="KHR">KHR (៛, approx.)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--ground-line)] pt-4 sm:grid-cols-4">
          <div className="rounded-lg border border-[var(--teal)]/40 bg-[var(--teal)]/10 p-3">
            <div className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">{t("Cost this batch", "ថ្លៃបាច់នេះ")}</div>
            <div className="mt-1 font-mono-ui text-2xl font-semibold tabular-nums text-[var(--ink)]">{fmtMoney(totalCost * fxRate, currency)}</div>
          </div>
          <div className="rounded-lg bg-[var(--ground)] p-3">
            <div className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">{t("Cost per request", "ថ្លៃក្នុងមួយសំណើ")}</div>
            <div className="mt-1 font-mono-ui text-xl font-semibold tabular-nums text-[var(--ink)]">{fmtMoney(costPerReq * fxRate, currency)}</div>
          </div>
          <div className="rounded-lg bg-[var(--ground)] p-3">
            <div className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">{t("Effective rate", "អត្រាជាក់ស្តែង")}</div>
            <div className="mt-1 font-mono-ui text-xl font-semibold tabular-nums text-[var(--ink)]">{currentPeriod === "peak" ? t("peak (2x)", "ខ្ពស់ (2x)") : t("off-peak (1x)", "ទាប (1x)")}</div>
          </div>
          <div className="rounded-lg bg-[var(--ground)] p-3">
            <div className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">{t("Total tokens", "Token សរុប")}</div>
            <div className="mt-1 font-mono-ui text-xl font-semibold tabular-nums text-[var(--ink)]">{totalTokens.toLocaleString()}</div>
          </div>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-[var(--ink-faint)]">
          {t("Estimate only — actual billing draws granted balance first, then topped-up balance, at DeepSeek's live posted rates. Off-peak = half of peak. FX rate is illustrative, not live.", "គ្រាន់តែជាការប៉ាន់ប្រមាណ — ការគិតថ្លៃពិតប្រាកដដកពីសមតុល្យដែលផ្តល់ដំបូង បន្ទាប់មកសមតុល្យបញ្ចូល តាមអត្រាដែល DeepSeek ប្រកាស។ ម៉ោងទាប = ពាក់កណ្តាលនៃម៉ោងខ្ពស់។ អត្រាប្តូរប្រាក់គ្រាន់តែជាឧទាហរណ៍។")}
        </p>
        <p className="mt-2 text-[11px] text-[var(--ink-faint)]">
          {t("Prices are reference data from", "តម្លៃជាទិន្នន័យយោងពី")}{" "}
          <a href="https://api-docs.deepseek.com/quick_start/pricing" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">api-docs.deepseek.com/quick_start/pricing <ExternalLink size={11} className="inline" /></a>
        </p>
      </div>
    </ToolShell>
  );
}