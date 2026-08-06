"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { BarChart3, CheckCircle2, Copy, Crown, Download, Eye, Flag, Gauge, Layers, Play, Plus, RotateCcw, Server, Settings, Sliders, Sparkles, Square, Trash2, XCircle, Zap } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface EndpointConfig {
  id: string; name: string; subtitleEn?: string; subtitleKm?: string;
  url: string; method: HttpMethod; enabled: boolean; color: string;
  headers: { key: string; value: string; enabled: boolean }[]; body?: string;
}

interface SingleRunResult {
  runIndex: number; status: number | null; statusText: string;
  timeMs: number; ttfbMs: number; sizeBytes: number; success: boolean;
  error?: string; timestamp: string; sampleResponseBody?: string;
}

interface BenchmarkMetrics {
  totalRuns: number; avgLatency: number; minLatency: number;
  maxLatency: number; medianLatency: number; p95Latency: number;
  successRate: number; stdDev: number; throughputKbps: number;
}

interface EndpointResult {
  endpointId: string; name: string; subtitle: string; color: string;
  runs: SingleRunResult[]; metrics: BenchmarkMetrics;
}

const PALETTE = ["#22c55e", "#f97316", "#a855f7", "#ec4899", "#3b82f6", "#10b981", "#06b6d4", "#f59e0b"];

const PRESETS: { id: string; name: string; endpoints: Omit<EndpointConfig, "id" | "name" | "enabled" | "color" | "headers">[] }[] = [
  {
    id: "arch", name: "Architecture Comparison",
    endpoints: [
      { url: "https://dummyjson.com/products/1", method: "GET" as const, subtitleEn: "REST cached", subtitleKm: "REST cache" },
      { url: "https://jsonplaceholder.typicode.com/posts/1", method: "GET" as const, subtitleEn: "REST uncached", subtitleKm: "REST ពេញ" },
      { url: "https://reqres.in/api/users/2", method: "GET" as const, subtitleEn: "GraphQL-style", subtitleKm: "GraphQL" },
      { url: "https://httpbin.org/get", method: "GET" as const, subtitleEn: "HTTP echo", subtitleKm: "HTTP echo" },
      { url: "https://pokeapi.co/api/v2/pokemon/ditto", method: "GET" as const, subtitleEn: "Open REST", subtitleKm: "API បើក" },
    ],
  },
  {
    id: "public", name: "Public REST APIs",
    endpoints: [
      { url: "https://jsonplaceholder.typicode.com/posts", method: "GET" as const, subtitleEn: "Mock JSON", subtitleKm: "JSON គំរូ" },
      { url: "https://dummyjson.com/products?limit=10", method: "GET" as const, subtitleEn: "eCommerce", subtitleKm: "ទំនិញ" },
      { url: "https://reqres.in/api/users?page=1", method: "GET" as const, subtitleEn: "Users list", subtitleKm: "អ្នកប្រើ" },
      { url: "https://pokeapi.co/api/v2/pokemon/ditto", method: "GET" as const, subtitleEn: "PokeAPI", subtitleKm: "Pokemon" },
    ],
  },
  {
    id: "cdn", name: "CDN & Edge",
    endpoints: [
      { url: "https://1.1.1.1/cdn-cgi/trace", method: "GET" as const, subtitleEn: "Cloudflare Edge", subtitleKm: "Cloudflare" },
      { url: "https://httpbin.org/ip", method: "GET" as const, subtitleEn: "HTTPBin", subtitleKm: "IP check" },
      { url: "https://cdn.jsdelivr.net/npm/react/package.json", method: "GET" as const, subtitleEn: "jsDelivr CDN", subtitleKm: "CDN" },
    ],
  },
];

function calcMetrics(runs: SingleRunResult[]): BenchmarkMetrics {
  const ok = runs.filter((r) => r.success);
  if (ok.length === 0) return { totalRuns: runs.length, avgLatency: 0, minLatency: 0, maxLatency: 0, medianLatency: 0, p95Latency: 0, successRate: 0, stdDev: 0, throughputKbps: 0 };
  const times = ok.map((r) => r.timeMs).sort((a, b) => a - b);
  const sum = times.reduce((a, v) => a + v, 0);
  const avg = Math.round(sum / ok.length);
  const p95 = times[Math.min(Math.floor(times.length * 0.95), times.length - 1)];
  const mid = Math.floor(times.length / 2);
  const med = times.length % 2 ? times[mid] : Math.round((times[mid - 1] + times[mid]) / 2);
  const variance = times.reduce((a, v) => a + (v - avg) ** 2, 0) / ok.length;
  const sizeSum = ok.reduce((a, r) => a + r.sizeBytes, 0);
  const tput = sum > 0 ? +((sizeSum / 1024) / (sum / 1000)).toFixed(1) : 0;
  return { totalRuns: runs.length, avgLatency: avg, minLatency: times[0], maxLatency: times[times.length - 1], medianLatency: med, p95Latency: p95, successRate: Math.round((ok.length / runs.length) * 100), stdDev: Math.round(Math.sqrt(variance)), throughputKbps: tput };
}

export default function ApiBenchmark() {
  const { text: t } = useLanguage();
  const [endpoints, setEndpoints] = useToolState<EndpointConfig[]>("ab:eps",
    PRESETS[0].endpoints.map((ep, i) => ({
      ...ep, id: `ep${i}`, name: `API ${i + 1}`, enabled: true, color: PALETTE[i], headers: [],
    })));
  const [reqCount, setReqCount] = useToolState("ab:reqs", 5);
  const [concurrent, setConcurrent] = useToolState("ab:mode", false);
  const [delayMs, setDelayMs] = useToolState("ab:delay", 300);
  const [timeoutSec, setTimeoutSec] = useToolState("ab:timeout", 8);
  const [results, setResults] = useState<EndpointResult[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ cur: 0, tot: 0 });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadPreset = (presetId: string) => {
    const p = PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    setEndpoints(p.endpoints.map((ep, i) => ({ ...ep, id: `ep${Date.now() + i}`, name: ep.subtitleEn || `API ${i + 1}`, enabled: true, color: PALETTE[i], headers: [] })));
    setResults([]);
  };

  const toggle = (id: string) => setEndpoints((p) => p.map((e) => e.id === id ? { ...e, enabled: !e.enabled } : e));
  const update = (id: string, patch: Partial<EndpointConfig>) => setEndpoints((p) => p.map((e) => e.id === id ? { ...e, ...patch } : e));
  const add = () => {
    const ep: EndpointConfig = { id: `ep${Date.now()}`, name: `API ${endpoints.length + 1}`, url: "https://jsonplaceholder.typicode.com/todos/1", method: "GET", enabled: true, color: PALETTE[endpoints.length % PALETTE.length], headers: [] };
    setEndpoints((p) => [...p, ep]); setExpanded(ep.id);
  };
  const del = (id: string) => { if (endpoints.length <= 1) return; setEndpoints((p) => p.filter((e) => e.id !== id)); if (detailId === id) setDetailId(null); };

  const pushResult = (ep: EndpointConfig, r: SingleRunResult) => {
    setResults((prev) => prev.map((er) => {
      if (er.endpointId !== ep.id) return er;
      const runs = [...er.runs, r].sort((a, b) => a.runIndex - b.runIndex);
      return { ...er, runs, metrics: calcMetrics(runs) };
    }));
  };

  async function run() {
    const active = endpoints.filter((e) => e.enabled && e.url.trim());
    if (!active.length) return;
    setRunning(true);
    const ctrl = new AbortController(); abortRef.current = ctrl;
    const tot = active.length * reqCount; setProgress({ cur: 0, tot });
    const all: EndpointResult[] = active.map((e) => ({ endpointId: e.id, name: e.name, subtitle: e.subtitleEn || "", color: e.color, runs: [], metrics: calcMetrics([]) }));
    setResults([...all]);
    let done = 0;

    async function runOne(ep: EndpointConfig, runIdx: number) {
      if (ctrl.signal.aborted) return;
      const opts: RequestInit = { method: ep.method, signal: ctrl.signal };
      ep.headers.filter((h) => h.enabled && h.key.trim()).forEach((h) => { (opts.headers as Record<string, string>)[h.key] = h.value; });
      if (["POST", "PUT", "PATCH"].includes(ep.method) && ep.body) { opts.body = ep.body; (opts.headers as Record<string, string>)["Content-Type"] = "application/json"; }
      const t0 = performance.now();
      let ttfb = 0;
      try {
        const timeout = new Promise<Response>((_, rej) => setTimeout(() => rej(new Error("TIMEOUT")), timeoutSec * 1000));
        const res = await Promise.race([fetch(ep.url, opts), timeout]) as Response;
        ttfb = Math.round(performance.now() - t0);
        const text = await res.text();
        const total = Math.max(1, Math.round(performance.now() - t0));
        return { runIndex: runIdx, status: res.status, statusText: res.statusText || "OK", timeMs: total, ttfbMs: ttfb, sizeBytes: new Blob([text]).size, success: res.ok, timestamp: new Date().toLocaleTimeString(), sampleResponseBody: text.slice(0, 2000) };
      } catch (err: any) {
        const total = Math.max(1, Math.round(performance.now() - t0));
        return { runIndex: runIdx, status: 0, statusText: "Failed", timeMs: total, ttfbMs: total, sizeBytes: 0, success: false, error: err.message === "TIMEOUT" ? `Timeout (${timeoutSec}s)` : err.message || "Network Error", timestamp: new Date().toLocaleTimeString() };
      }
    }

    if (concurrent) {
      const tasks: Promise<void>[] = [];
      for (const ep of active) {
        for (let i = 1; i <= reqCount; i++) {
          tasks.push((async () => {
            const r = await runOne(ep, i);
            if (ctrl.signal.aborted || !r) return;
            done++; setProgress({ cur: done, tot });
            pushResult(ep, r);
          })());
        }
      }
      await Promise.all(tasks);
    } else {
      for (const ep of active) {
        for (let i = 1; i <= reqCount; i++) {
          if (ctrl.signal.aborted) break;
          setProgress({ cur: done + 1, tot });
          const r = await runOne(ep, i);
          if (!r) break;
          done++;
          if (ctrl.signal.aborted) break;
          pushResult(ep, r);
          if (delayMs > 0 && i < reqCount) await new Promise((res) => setTimeout(res, delayMs));
        }
      }
    }
    setRunning(false);
  }

  const cancel = () => { abortRef.current?.abort(); setRunning(false); };
  const maxAvg = useMemo(() => results.length ? Math.max(...results.map((r) => r.metrics.avgLatency), 100) * 1.15 : 100, [results]);
  const winnerId = useMemo(() => { let min = Infinity; let id: string | null = null; results.forEach((r) => { if (r.metrics.avgLatency > 0 && r.metrics.avgLatency < min) { min = r.metrics.avgLatency; id = r.endpointId; } }); return id; }, [results]);
  const detail = results.find((r) => r.endpointId === detailId) || results[0];

  function exportCsv() {
    let csv = "Endpoint,Run,Status,Latency (ms),TTFB (ms),Size (B)\n";
    results.forEach((er) => er.runs.forEach((r) => { csv += `"${er.name}",${r.runIndex},${r.status},${r.timeMs},${r.ttfbMs},${r.sizeBytes}\n`; }));
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "api-benchmark.csv"; a.click();
  }

  return (
    <ToolShell title="API Benchmark" khmerTitle="ប្រៀបធៀបល្បឿន API" description="Benchmark response times across multiple API endpoints — sequential or parallel, with metrics, race track view, and CSV export." descriptionKm="វាស់ពេលឆ្លើយតប API ច្រើន — រត់តាមលំដាប់ ឬស្របគ្នា មានម៉ែត្រវិទ្យា ទិដ្ឋភាពប្រណាំង និងទាញចេញ CSV។">
      {/* Running bar */}
      {running && (
        <div className="mb-4 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-4 py-2.5 text-sm">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--gold)]">{t("Benchmarking…", "កំពុងសាកល្បង…")}</span>
            <span className="text-[var(--ink-faint)]">{progress.cur}/{progress.tot}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[var(--ground-line)]"><div className="h-full rounded-full bg-[var(--gold)] transition-all" style={{ width: `${progress.tot ? (progress.cur / progress.tot) * 100 : 0}%` }} /></div>
        </div>
      )}

      {/* Run controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
        {running ? (
          <button onClick={cancel} className="flex items-center gap-1.5 rounded-md bg-[var(--danger)]/80 px-3 py-1.5 text-xs font-semibold text-white"><XCircle size={14} />{t("Cancel", "បោះបង់")}</button>
        ) : (
          <button onClick={run} className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-semibold text-[#0a0c0d]"><Play size={14} />{t("Run", "រត់")}</button>
        )}
        <span className="text-[11px] text-[var(--ink-faint)]">{t("Requests:", "សំណើ:")}</span>
        <input type="number" min={1} max={30} value={reqCount} onChange={(e) => setReqCount(Math.max(1, +e.target.value || 1))} className="w-14 rounded border border-[var(--ground-line)] bg-[var(--ground)] px-1.5 py-1 text-xs text-center text-[var(--ink)]" />
        <button onClick={() => setConcurrent(!concurrent)} className={`rounded-md px-2 py-1 text-xs font-semibold ${concurrent ? "bg-[var(--teal)]/20 text-[var(--teal)]" : "bg-[var(--ground)] text-[var(--ink-dim)]"}`}>{concurrent ? t("Parallel", "ស្រប") : t("Sequential", "តាមលំដាប់")}</button>
        <span className="text-[11px] text-[var(--ink-faint)]">{t("Delay:", "ពន្យារ:")}</span>
        <input type="number" min={0} step={100} value={delayMs} onChange={(e) => setDelayMs(Math.max(0, +e.target.value || 0))} className="w-16 rounded border border-[var(--ground-line)] bg-[var(--ground)] px-1.5 py-1 text-xs text-center text-[var(--ink)]" />
        <span className="text-[11px] text-[var(--ink-faint)]">ms</span>
        {results.length > 0 && (
          <button onClick={() => { setResults([]); setDetailId(null); }} className="ml-auto flex items-center gap-1 rounded-md border border-[var(--ground-line)] px-2 py-1 text-xs text-[var(--ink-faint)]"><RotateCcw size={11} />{t("Clear", "សម្អាត")}</button>
        )}
      </div>

      {/* Presets */}
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" onClick={() => loadPreset(p.id)} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2.5 py-1 text-xs font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)] transition">{p.name} ({p.endpoints.length})</button>
        ))}
        <span className="self-center text-[10px] text-[var(--ink-faint)]">{endpoints.length} {t("total", "សរុប")}</span>
      </div>

      {/* Endpoint list */}
      <div className="mb-4 space-y-2">
        {endpoints.map((ep) => (
          <div key={ep.id} className={`rounded-lg border transition ${ep.enabled ? "border-[var(--ground-line)] bg-[var(--ground-raised)]" : "border-[var(--ground-line)] bg-[var(--ground)] opacity-60"}`}>
            <div className="flex items-center gap-2 p-2.5">
              <button type="button" onClick={() => toggle(ep.id)} className="shrink-0">{ep.enabled ? <CheckCircle2 size={16} className="text-[var(--success)]" /> : <Square size={16} className="text-[var(--ink-faint)]" />}</button>
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: ep.color }} />
              <span className={`rounded text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${ep.method === "GET" ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--gold)]/10 text-[var(--gold)]"}`}>{ep.method}</span>
              <input value={ep.name} onChange={(e) => update(ep.id, { name: e.target.value })} className="min-w-0 flex-1 bg-transparent text-xs font-bold text-[var(--ink)] outline-none" />
              <input value={ep.url} onChange={(e) => update(ep.id, { url: e.target.value })} className="hidden sm:block min-w-0 flex-1 bg-transparent font-mono-ui text-[11px] text-[var(--ink-dim)] outline-none" />
              <button onClick={() => setExpanded(expanded === ep.id ? null : ep.id)} className="shrink-0 rounded p-1 text-[var(--ink-faint)] hover:bg-[var(--ground)]"><Settings size={13} /></button>
              <button onClick={() => del(ep.id)} className="shrink-0 rounded p-1 text-[var(--ink-faint)] hover:text-[var(--danger)]"><Trash2 size={13} /></button>
            </div>
            {expanded === ep.id && (
              <div className="border-t border-[var(--ground-line)] p-3 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <select value={ep.method} onChange={(e) => update(ep.id, { method: e.target.value as HttpMethod })} className="rounded border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-1 text-[var(--ink)]"><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option></select>
                  <input value={ep.subtitleEn || ""} onChange={(e) => update(ep.id, { subtitleEn: e.target.value })} placeholder="Tag" className="rounded border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-1 text-[var(--ink)]" />
                  {["POST", "PUT", "PATCH"].includes(ep.method) && <textarea value={ep.body || ""} onChange={(e) => update(ep.id, { body: e.target.value })} placeholder='{"key":"value"}' className="col-span-2 resize-none rounded border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-1 font-mono-ui text-[var(--ink)]" rows={2} />}
                </div>
              </div>
            )}
          </div>
        ))}
        <button onClick={add} className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--ground-line)] py-2 text-xs font-semibold text-[var(--ink-faint)] hover:text-[var(--ink)]"><Plus size={12} />{t("Add Endpoint", "បន្ថែម API")}</button>
      </div>

      {/* Results: Race Track */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--gold)]"><Zap size={14} />{t("Race Track", "ផ្លូវប្រណាំង")}</div>
            {results.map((r) => {
              const pct = Math.min(100, Math.max(6, Math.round((r.metrics.avgLatency / maxAvg) * 82)));
              const isWinner = r.endpointId === winnerId;
              return (
                <div key={r.endpointId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                      <span className="font-bold text-[var(--ink)]">{r.name}</span>
                      {isWinner && <span className="rounded bg-[var(--gold)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--gold)]">👑 {t("Fastest", "លឿនជាងគេ")}</span>}
                    </div>
                    <span className="font-mono-ui font-bold text-[var(--ink)]">{r.metrics.avgLatency} ms</span>
                  </div>
                  <div className="h-10 w-full overflow-hidden rounded-lg border border-[var(--ground-line)] bg-[var(--ground)]">
                    <div className="flex h-full items-center rounded-lg px-1" style={{ width: `${pct}%`, background: `${r.color}22`, borderRight: `3px solid ${r.color}` }}>
                      <div className="ml-auto flex h-6 w-7 items-center justify-center rounded border font-mono-ui text-[10px] font-bold" style={{ borderColor: r.color, color: r.color, background: "var(--ground)" }}>≡</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Metrics table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--ground-line)]">
            <table className="w-full text-left text-[11px]">
              <thead className="border-b border-[var(--ground-line)] bg-[var(--ground)] text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
                <tr>
                  <th className="px-3 py-2">{t("Endpoint", "API")}</th>
                  <th className="px-3 py-2">{t("Avg", "មធ្យម")}</th>
                  <th className="px-3 py-2">{t("Min/Max", "អប្ប/អតិ")}</th>
                  <th className="px-3 py-2">{t("P95", "P95")}</th>
                  <th className="px-3 py-2">{t("Success", "ជោគជ័យ")}</th>
                  <th className="px-3 py-2">{t("Runs", "ជុំ")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ground-line)]">
                {results.map((r) => (
                  <tr key={r.endpointId} onClick={() => setDetailId(r.endpointId === detailId ? null : r.endpointId)} className={`cursor-pointer transition hover:bg-[var(--ground)] ${detailId === r.endpointId ? "bg-[var(--gold)]/5" : ""}`}>
                    <td className="px-3 py-2 font-bold text-[var(--ink)] flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: r.color }} />{r.name}</td>
                    <td className="px-3 py-2 font-mono-ui font-bold text-[var(--ink)]">{r.metrics.avgLatency}ms</td>
                    <td className="px-3 py-2 font-mono-ui text-[var(--ink-dim)]">{r.metrics.minLatency}/{r.metrics.maxLatency}ms</td>
                    <td className="px-3 py-2 font-mono-ui text-[var(--ink-dim)]">{r.metrics.p95Latency}ms</td>
                    <td className="px-3 py-2"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${r.metrics.successRate === 100 ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--danger)]/10 text-[var(--danger)]"}`}>{r.metrics.successRate}%</span></td>
                    <td className="px-3 py-2 text-[var(--ink-dim)]">{r.metrics.totalRuns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail inspector */}
          {detail && (
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)]"><Eye size={14} className="text-[var(--gold)]" />{detail.name}</div>
                <button onClick={exportCsv} className="flex items-center gap-1 rounded border border-[var(--ground-line)] px-2 py-1 text-[10px] font-semibold text-[var(--ink-faint)]"><Download size={11} />CSV</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="text-[10px] text-[var(--ink-faint)]"><tr><th className="p-1.5">#</th><th className="p-1.5">Status</th><th className="p-1.5">Time</th><th className="p-1.5">TTFB</th><th className="p-1.5">Size</th></tr></thead>
                  <tbody className="divide-y divide-[var(--ground-line)]">
                    {detail.runs.map((r) => (
                      <tr key={r.runIndex} className="text-[var(--ink-dim)]">
                        <td className="p-1.5 font-mono-ui">{r.runIndex}</td>
                        <td className="p-1.5">{r.success ? <span className="text-[var(--success)]">{r.status} OK</span> : <span className="text-[var(--danger)]" title={r.error}>{r.statusText}</span>}</td>
                        <td className="p-1.5 font-mono-ui font-bold text-[var(--ink)]">{r.timeMs}ms</td>
                        <td className="p-1.5 font-mono-ui">{r.ttfbMs}ms</td>
                        <td className="p-1.5 font-mono-ui">{(r.sizeBytes / 1024).toFixed(2)}KB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {results.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--ground-line)] p-8 text-center text-sm text-[var(--ink-dim)]">
          {t("Configure endpoints above and click Run to benchmark.", "កំណត់ API ខាងលើ ហើយចុច Run ដើម្បីសាកល្បង។")}
        </div>
      )}
    </ToolShell>
  );
}
