'use client';
// components/beam/SendPanel.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  robustSolitonTable, splitBlocks, encodePayload, packFrame, sha256, bytesToBinaryString,
} from '../../lib/beam/engine';
import { loadBeamLibs } from '../../lib/beam/qrlibs';
import { bt, type BeamLang } from '../../lib/beam/i18n';
import type { BeamSendPayload, BeamSettings } from '../../lib/beam/types';
import { DEFAULT_BEAM_SETTINGS } from '../../lib/beam/types';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function toStreamable(payload: BeamSendPayload | null): { bytes: Uint8Array; filename: string; mime: string } | null {
  if (!payload) return null;
  if (payload.kind === 'file') return { bytes: payload.bytes, filename: payload.filename, mime: payload.mime };
  const bytes = new TextEncoder().encode(payload.text);
  return { bytes, filename: payload.filename ?? 'message.txt', mime: 'text/plain' };
}

export function SendPanel({ payload, lang }: { payload: BeamSendPayload | null; lang: BeamLang }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [libsReady, setLibsReady] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [settings, setSettings] = useState<BeamSettings>(DEFAULT_BEAM_SETTINGS);
  const [framesSent, setFramesSent] = useState(0);
  const [blocks, setBlocks] = useState(0);
  const [throughput, setThroughput] = useState('0 KB/s');
  const genRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const item = toStreamable(payload);

  useEffect(() => {
    loadBeamLibs().then(() => setLibsReady(true));
  }, []);

  useEffect(() => () => {
    genRef.current++;
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  function drawFrame(bytes: Uint8Array, ec: BeamSettings['ec']) {
    const canvas = canvasRef.current;
    if (!canvas || !window.qrcode) return;
    const str = bytesToBinaryString(bytes);
    let qr: ReturnType<Window['qrcode']> | null = null;
    for (let type = 0; type <= 40; type++) {
      try {
        const candidate = window.qrcode(type, ec);
        candidate.addData(str, 'Byte');
        candidate.make();
        qr = candidate;
        break;
      } catch {
        qr = null;
      }
    }
    if (!qr) return;
    const n = qr.getModuleCount();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    const cell = size / n;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) ctx.fillRect(Math.round(c * cell), Math.round(r * cell), Math.ceil(cell), Math.ceil(cell));
      }
    }
  }

  async function start() {
    if (!item || !libsReady) return;
    genRef.current++;
    const myGen = genRef.current;

    const { bytes, filename, mime } = item;
    const { fps, blockSize, ec } = settings;
    const K = Math.ceil(bytes.length / blockSize);
    const blockList = splitBlocks(bytes, blockSize);
    const cdf = robustSolitonTable(K);
    const sha = await sha256(bytes);
    const sessionId = Math.floor(Math.random() * 0xffffffff);

    setBlocks(K);
    setFramesSent(0);
    setStreaming(true);

    let seq = 0;
    let sent = 0;
    const startTime = performance.now();

    function tick() {
      if (myGen !== genRef.current) return;
      const p = encodePayload(blockList, K, blockSize, seq, cdf);
      const frame = packFrame({ sessionId, seq, K, blockSize, totalLen: bytes.length, name: filename, mime, sha256Bytes: sha, payload: p });
      drawFrame(frame, ec);
      seq = (seq + 1) >>> 0;
      sent++;
      setFramesSent(sent);
      const elapsed = (performance.now() - startTime) / 1000;
      setThroughput(`${((sent * blockSize) / 1024 / Math.max(elapsed, 0.001)).toFixed(1)} KB/s`);
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(tick, 1000 / fps);
    tick();
  }

  function stop() {
    genRef.current++;
    if (timerRef.current) clearInterval(timerRef.current);
    setStreaming(false);
  }

  if (!item) {
    return <p className="text-sm text-neutral-400">Nothing to send yet — trigger this from a tool's Beam button.</p>;
  }

  return (
    <div>
      {!streaming ? (
        <div>
          <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-4 mb-4">
            <div className="text-sm text-neutral-300">{item.filename}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{formatBytes(item.bytes.length)} · {item.mime}</div>
          </div>

          <details className="mb-4">
            <summary className="cursor-pointer text-sm font-medium text-neutral-400">{bt(lang, 'settings')}</summary>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <label className="flex flex-col gap-1 text-xs text-neutral-400">
                {bt(lang, 'txFps')}
                <select
                  value={settings.fps}
                  onChange={(e) => setSettings((s) => ({ ...s, fps: Number(e.target.value) }))}
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-200"
                >
                  {[10, 16, 20, 24].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-neutral-400">
                {bt(lang, 'bytesPerFrame')}
                <select
                  value={settings.blockSize}
                  onChange={(e) => setSettings((s) => ({ ...s, blockSize: Number(e.target.value) }))}
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-200"
                >
                  {[300, 500, 700, 900].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-neutral-400">
                {bt(lang, 'ecLevel')}
                <select
                  value={settings.ec}
                  onChange={(e) => setSettings((s) => ({ ...s, ec: e.target.value as BeamSettings['ec'] }))}
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-200"
                >
                  <option value="L">L</option>
                  <option value="M">M</option>
                  <option value="Q">Q</option>
                  <option value="H">H</option>
                </select>
              </label>
            </div>
          </details>

          <button
            type="button"
            onClick={start}
            disabled={!libsReady}
            className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-neutral-950 hover:brightness-105 disabled:opacity-50"
          >
            {bt(lang, 'startStream')}
          </button>
        </div>
      ) : (
        <div>
          <div className="aspect-square w-full overflow-hidden rounded-lg border border-neutral-700 bg-black">
            <canvas ref={canvasRef} width={640} height={640} className="h-full w-full object-contain" />
          </div>

          <div className="grid grid-cols-3 gap-px mt-3 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-700 text-center">
            <div className="bg-neutral-900 px-2 py-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500">{bt(lang, 'framesSent')}</div>
              <div className="font-mono text-amber-400">{framesSent}</div>
            </div>
            <div className="bg-neutral-900 px-2 py-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500">{bt(lang, 'blocksLabel')}</div>
              <div className="font-mono text-amber-400">{blocks}</div>
            </div>
            <div className="bg-neutral-900 px-2 py-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500">{bt(lang, 'throughput')}</div>
              <div className="font-mono text-amber-400">{throughput}</div>
            </div>
          </div>

          <p className="mt-3 text-xs text-neutral-500">{bt(lang, 'brightnessHint')}</p>

          <button type="button" onClick={stop} className="mt-3 w-full rounded-lg border border-neutral-700 px-4 py-2.5 font-medium text-neutral-200 hover:bg-neutral-800">
            {bt(lang, 'stopStream')}
          </button>
        </div>
      )}
    </div>
  );
}
