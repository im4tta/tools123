"use client";
import { useState } from "react";
import { Gauge, Loader2 } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

type Phase = "idle" | "ping" | "download" | "upload" | "done";

interface Results {
  pingMs: number | null;
  jitterMs: number | null;
  downMbps: number | null;
  upMbps: number | null;
}

async function timePing(): Promise<number> {
  const start = performance.now();
  await fetch(`https://speed.cloudflare.com/__down?bytes=0&r=${Math.random()}`, { cache: "no-store" });
  return performance.now() - start;
}

export default function SpeedTest() {
  const { text: t } = useLanguage();
  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<Results>({ pingMs: null, jitterMs: null, downMbps: null, upMbps: null });
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function run() {
    setError("");
    setResults({ pingMs: null, jitterMs: null, downMbps: null, upMbps: null });

    // Ping + jitter
    setPhase("ping");
    try {
      const samples: number[] = [];
      for (let i = 0; i < 5; i++) samples.push(await timePing());
      const avg = samples.reduce((s, v) => s + v, 0) / samples.length;
      const jitter = Math.sqrt(samples.reduce((s, v) => s + (v - avg) ** 2, 0) / samples.length);
      setResults((r) => ({ ...r, pingMs: Math.round(avg), jitterMs: Math.round(jitter) }));
    } catch {
      setError(t("Could not reach the test server.", "មិនអាចទៅដល់ម៉ាស៊ីនបម្រើសាកល្បងបានទេ។"));
      setPhase("idle");
      return;
    }

    // Download (streamed, ~12 MB)
    setPhase("download");
    setProgress(0);
    try {
      const res = await fetch(`https://speed.cloudflare.com/__down?bytes=12000000&r=${Math.random()}`, { cache: "no-store" });
      const reader = res.body?.getReader();
      let received = 0;
      const start = performance.now();
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          received += value.byteLength;
          setProgress(Math.min(99, Math.round((received / 12000000) * 100)));
        }
      }
      const seconds = (performance.now() - start) / 1000;
      setResults((r) => ({ ...r, downMbps: Number(((received * 8) / seconds / 1e6).toFixed(1)) }));
    } catch {
      setResults((r) => ({ ...r, downMbps: null }));
    }

    // Upload (~4 MB random payload)
    setPhase("upload");
    setProgress(0);
    try {
      const payload = new Uint8Array(4000000);
      crypto.getRandomValues(payload);
      const start = performance.now();
      await fetch("https://speed.cloudflare.com/__up", { method: "POST", body: payload });
      const seconds = (performance.now() - start) / 1000;
      setResults((r) => ({ ...r, upMbps: Number(((payload.length * 8) / seconds / 1e6).toFixed(1)) }));
    } catch {
      setResults((r) => ({ ...r, upMbps: null }));
    }

    setProgress(100);
    setPhase("done");
  }

  const running = phase === "ping" || phase === "download" || phase === "upload";

  return (
    <ToolShell
      title="Internet Speed Test"
      khmerTitle="តេស្តល្បឿនអ៊ីនធឺណិត"
      description="Measure real ping, download, and upload speed against Cloudflare's public speed endpoints."
      descriptionKm="វាស់ពិង ទាញយក និងបញ្ជូនជាក់ស្តែងតាមម៉ាស៊ីនបម្រើ Cloudflare។"
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-8">
          {running ? (
            <>
              <Loader2 size={34} className="animate-spin text-[var(--teal)]" />
              <div className="text-sm font-semibold text-[var(--ink)]">
                {phase === "ping" ? t("Measuring latency…", "កំពុងវាស់ពិង…") : phase === "download" ? `${t("Testing download…", "កំពុងសាកល្បងទាញយក…")} ${progress}%` : `${t("Testing upload…", "កំពុងសាកល្បងបញ្ជូន…")} ${progress}%`}
              </div>
            </>
          ) : (
            <>
              <Gauge size={34} className="text-[var(--teal)]" />
              <button type="button" onClick={run} className="rounded-xl bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]">
                {phase === "done" ? t("Test again", "សាកល្បងម្តងទៀត") : t("Start speed test", "ចាប់ផ្តើមតេស្តល្បឿន")}
              </button>
            </>
          )}
        </div>

        {(results.pingMs !== null || results.downMbps !== null || results.upMbps !== null) && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              [t("Ping", "ពិង"), results.pingMs !== null ? `${results.pingMs} ms` : "—"],
              [t("Jitter", "ជីតធឺ"), results.jitterMs !== null ? `${results.jitterMs} ms` : "—"],
              [t("Download", "ទាញយក"), results.downMbps !== null ? `${results.downMbps} Mbps` : "—"],
              [t("Upload", "បញ្ជូន"), results.upMbps !== null ? `${results.upMbps} Mbps` : "—"],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-center">
                <div className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
                <div className="mt-1 font-mono-ui text-lg font-semibold tabular-nums text-[var(--ink)]">{value}</div>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          {t("Live measurement against Cloudflare's public speed endpoints (speed.cloudflare.com). Results depend on Wi-Fi, VPN, and other traffic on your connection.", "ការវាស់ផ្ទាល់តាមចំណុចបម្រើ Cloudflare (speed.cloudflare.com)។ លទ្ធផលអាស្រ័យលើ Wi-Fi VPN និងការប្រើប្រាស់ផ្សេងទៀត។")}
        </p>
      </div>
    </ToolShell>
  );
}