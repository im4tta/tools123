"use client";
import { useEffect, useRef, useState } from "react";
import { ToolShell, Field, TextInput, TextArea } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Status = "idle" | "connecting" | "open" | "closed" | "error";
type Direction = "in" | "out" | "sys";

interface LogEntry {
  id: number;
  dir: Direction;
  text: string;
  time: string;
}

const STATUS_META: Record<Status, { en: string; km: string; cls: string }> = {
  idle: { en: "Idle", km: "រង់ចាំ", cls: "bg-[var(--ground-raised)] text-[var(--ink-dim)]" },
  connecting: { en: "Connecting…", km: "កំពុងតភ្ជាប់…", cls: "bg-amber-500/15 text-amber-600" },
  open: { en: "Connected", km: "បានតភ្ជាប់", cls: "bg-emerald-500/15 text-emerald-600" },
  closed: { en: "Closed", km: "បានបិទ", cls: "bg-[var(--ground-raised)] text-[var(--ink-dim)]" },
  error: { en: "Error", km: "កំហុស", cls: "bg-red-500/15 text-red-600" },
};

const DIR_ARROW: Record<Direction, string> = { in: "↓", out: "↑", sys: "•" };

export default function WebsocketTester() {
  const { text: t } = useLanguage();
  const [url, setUrl] = useToolState("websocket-tester:url", "wss://echo.websocket.org");
  const [message, setMessage] = useToolState("websocket-tester:message", "");
  const [status, setStatus] = useState<Status>("idle");
  const [log, setLog] = useState<LogEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const idRef = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (dir: Direction, text: string) => {
    const entry: LogEntry = { id: idRef.current, dir, text, time: new Date().toLocaleTimeString() };
    idRef.current += 1;
    setLog((prev) => [...prev.slice(-199), entry]);
  };

  const connect = () => {
    if (wsRef.current) return;
    const target = url.trim();
    if (!/^wss?:\/\//i.test(target)) {
      addLog("sys", t("Please enter a valid ws:// or wss:// URL.", "សូមបញ្ចូល URL ws:// ឬ wss:// ឱ្យបានត្រឹមត្រូវ។"));
      return;
    }
    setStatus("connecting");
    try {
      const ws = new WebSocket(target);
      wsRef.current = ws;
      ws.onopen = () => {
        setStatus("open");
        addLog("sys", t("Connected", "បានតភ្ជាប់"));
      };
      ws.onmessage = (e) => addLog("in", typeof e.data === "string" ? e.data : t("(binary message)", "(សារគោលពីរ)"));
      ws.onerror = () => {
        wsRef.current = null;
        setStatus("error");
        addLog("sys", t("WebSocket error", "កំហុស WebSocket"));
      };
      ws.onclose = (e) => {
        if (wsRef.current === ws) {
          wsRef.current = null;
          setStatus("closed");
          addLog("sys", `${t("Closed", "បានបិទ")} (${e.code}${e.reason ? " " + e.reason : ""})`);
        }
      };
    } catch {
      setStatus("error");
      addLog("sys", t("Could not open the connection.", "មិនអាចបើកការតភ្ជាប់បានទេ។"));
    }
  };

  const disconnect = () => {
    const ws = wsRef.current;
    if (ws) {
      wsRef.current = null;
      setStatus("closed");
      addLog("sys", t("Disconnected", "បានផ្ដាច់"));
      ws.close();
    }
  };

  const send = () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !message.trim()) return;
    ws.send(message);
    addLog("out", message);
  };

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  const meta = STATUS_META[status];

  return (
    <ToolShell
      title="WebSocket Tester"
      khmerTitle="ឧបករណ៍សាកល្បង WebSocket"
      description="Connect to a WebSocket server, exchange text or JSON messages, and inspect the live in/out log."
      descriptionKm="ភ្ជាប់ទៅម៉ាស៊ីនមេ WebSocket ផ្ញើទទួលសារអត្ថបទ ឬ JSON និងពិនិត្យកំណត់ហេតុទទួល/ផ្ញើផ្ទាល់។"
    >
      <Field label={t("Server URL", "URL ម៉ាស៊ីនមេ")}>
        <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="wss://echo.websocket.org" />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={connect} disabled={status === "connecting" || status === "open"}>
          {t("Connect", "តភ្ជាប់")}
        </Button>
        <Button onClick={disconnect} disabled={status !== "connecting" && status !== "open"}>
          {t("Disconnect", "ផ្ដាច់")}
        </Button>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${meta.cls}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {t(meta.en, meta.km)}
        </span>
      </div>
      <Field label={t("Message", "សារ")} hint={t("Plain text or a JSON payload.", "អត្ថបទ ឬ JSON ។")}>
        <TextArea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={'{"type":"ping"}'} />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={send} disabled={status !== "open"}>
          {t("Send", "ផ្ញើ")}
        </Button>
        <button
          type="button"
          onClick={() => setLog([])}
          className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm font-medium text-[var(--ink-dim)] transition hover:text-[var(--ink)]"
        >
          {t("Clear log", "សម្អាតកំណត់ហេតុ")}
        </button>
      </div>
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]">
        <div ref={logRef} className="max-h-72 overflow-auto p-3 font-mono-ui text-xs leading-relaxed">
          {log.length === 0 ? (
            <p className="text-[var(--ink-faint)]">{t("No messages yet.", "មិនទាន់មានសារនៅឡើយទេ។")}</p>
          ) : (
            log.map((entry) => (
              <div key={entry.id} className="flex gap-2 py-0.5">
                <span className="shrink-0 text-[var(--ink-faint)]">{entry.time}</span>
                <span
                  className={`shrink-0 ${
                    entry.dir === "in" ? "text-emerald-600" : entry.dir === "out" ? "text-amber-600" : "text-[var(--ink-faint)]"
                  }`}
                >
                  {DIR_ARROW[entry.dir]}
                </span>
                <span className="whitespace-pre-wrap break-all text-[var(--ink)]">{entry.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t("Provenance: original Tools123 implementation.", "ប្រភព៖ ការអនុវត្តឯករាជ្យរបស់ Tools123។")}
      </p>
    </ToolShell>
  );
}
