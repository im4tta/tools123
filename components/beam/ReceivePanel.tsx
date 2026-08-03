'use client';
// components/beam/ReceivePanel.tsx
import React, { useEffect, useRef, useState } from 'react';
import { robustSolitonTable, Decoder, unpackFrame, sha256, bytesToHex } from '../../lib/beam/engine';
import { loadBeamLibs } from '../../lib/beam/qrlibs';
import { bt, type BeamLang } from '../../lib/beam/i18n';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

interface ResultState {
  isText: boolean;
  text?: string;
  filename?: string;
  mime?: string;
  blobUrl?: string;
  totalLen?: number;
  ok: boolean;
}

export function ReceivePanel({ lang }: { lang: BeamLang }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const rafGenRef = useRef(0);
  const decoderRef = useRef<Decoder | null>(null);
  const metaRef = useRef<{ K: number; blockSize: number; totalLen: number; name: string; mime: string; sha256Bytes: Uint8Array } | null>(null);
  const sessionRef = useRef<number | null>(null);

  const [libsReady, setLibsReady] = useState(false);
  const [active, setActive] = useState(false);
  const [live, setLive] = useState(false);
  const [framesCaptured, setFramesCaptured] = useState(0);
  const [blocksLine, setBlocksLine] = useState('0 / 0');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ResultState | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadBeamLibs().then(() => setLibsReady(true)); }, []);
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    if (!libsReady) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      // Set active FIRST so the <video> element mounts, then useEffect hooks the stream to it.
      decoderRef.current = null;
      metaRef.current = null;
      sessionRef.current = null;
      setFramesCaptured(0);
      setBlocksLine('0 / 0');
      setProgress(0);
      setLive(false);
      setResult(null);
      setActive(true);
    } catch {
      alert(bt(lang, 'cameraError'));
    }
  }

  // When the video element mounts (active becomes true), attach the waiting stream.
  useEffect(() => {
    if (!active || !streamRef.current) return;
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = streamRef.current;
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    video.muted = true;
    let cancelled = false;
    video.play().then(() => {
      if (cancelled) return;
      startScan();
    }).catch(() => {
      if (!cancelled) alert(bt(lang, 'cameraError'));
    });
    return () => { cancelled = true; };
  }, [active]);

  function startScan() {
    rafGenRef.current++;
    const myGen = rafGenRef.current;
    const loop = () => {
      if (myGen !== rafGenRef.current) return;
      scanFrame();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }

  function stop() {
    rafGenRef.current++;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setActive(false);
  }

  function scanFrame() {
    const video = videoRef.current;
    const hidden = hiddenCanvasRef.current;
    if (!video || !hidden || video.readyState !== video.HAVE_ENOUGH_DATA) return;
    const w = video.videoWidth, h = video.videoHeight;
    if (!w || !h) return;
    hidden.width = w;
    hidden.height = h;
    const hctx = hidden.getContext('2d', { willReadFrequently: true });
    if (!hctx) return;
    hctx.drawImage(video, 0, 0, w, h);
    const imageData = hctx.getImageData(0, 0, w, h);
    const code = window.jsQR ? window.jsQR(imageData.data as unknown as Uint8ClampedArray, w, h, { inversionAttempts: 'dontInvert' }) : null;
    if (!code || !code.binaryData) return;

    const bytes = Uint8Array.from(code.binaryData);
    const parsed = unpackFrame(bytes);
    if (!parsed) return;

    setFramesCaptured((n) => n + 1);
    setLive(true);

    if (sessionRef.current !== parsed.sessionId) {
      sessionRef.current = parsed.sessionId;
      metaRef.current = parsed;
      const cdf = robustSolitonTable(parsed.K);
      decoderRef.current = new Decoder(parsed.K, parsed.blockSize, cdf);
    }

    const decoder = decoderRef.current!;
    decoder.addFrame(parsed.seq, parsed.payload);
    setBlocksLine(`${decoder.resolvedCount} / ${decoder.K}`);
    setProgress(Math.round((decoder.resolvedCount / decoder.K) * 100));

    if (decoder.isComplete) finish();
  }

  async function finish() {
    rafGenRef.current++;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setActive(false);

    const decoder = decoderRef.current!;
    const meta = metaRef.current!;
    const assembled = decoder.assemble(meta.totalLen)!;
    const gotHash = await sha256(assembled);
    const ok = bytesToHex(gotHash) === bytesToHex(meta.sha256Bytes);
    const isText = meta.mime.startsWith('text/');

    if (isText) {
      setResult({ isText: true, text: new TextDecoder().decode(assembled), ok });
    } else {
      const blob = new Blob([assembled.buffer as ArrayBuffer], { type: meta.mime || 'application/octet-stream' });
      setResult({ isText: false, filename: meta.name, mime: meta.mime, blobUrl: URL.createObjectURL(blob), totalLen: meta.totalLen, ok });
    }
  }

  function reset() {
    setResult(null);
  }

  if (result) {
    return (
      <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-5 text-center">
        <h3 className="font-semibold text-neutral-100">{bt(lang, 'transferComplete')}</h3>
        {result.isText ? (
          <>
            <textarea readOnly value={result.text} className="mt-3 h-28 w-full resize-y rounded border border-neutral-700 bg-neutral-950 p-2 text-sm text-neutral-200" />
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(result.text ?? ''); setCopied(true); }}
              className="mt-3 w-full rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-neutral-950 hover:brightness-105"
            >
              {copied ? bt(lang, 'copied') : bt(lang, 'copyText')}
            </button>
          </>
        ) : (
          <>
            <div className="mt-1 mb-4 break-all text-xs text-neutral-500">{result.filename} · {formatBytes(result.totalLen ?? 0)}</div>
            <a
              href={result.blobUrl}
              download={result.filename}
              className="block w-full rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-neutral-950 hover:brightness-105"
            >
              {bt(lang, 'download')}
            </a>
          </>
        )}
        <div className={`mt-3 text-xs ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {result.ok ? bt(lang, 'verifiedOk') : bt(lang, 'verifiedFail')}
        </div>
        <button type="button" onClick={reset} className="mt-4 w-full rounded-lg border border-neutral-700 px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800">
          {bt(lang, 'newTransfer')}
        </button>
      </div>
    );
  }

  return (
    <div>
      {!active ? (
        <button
          type="button"
          onClick={start}
          disabled={!libsReady}
          className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-neutral-950 hover:brightness-105 disabled:opacity-50"
        >
          {bt(lang, 'startCamera')}
        </button>
      ) : (
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-neutral-400">
            <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
            {bt(lang, 'waitingForSignal')}
          </div>

          <div className="aspect-square w-full overflow-hidden rounded-lg border border-neutral-700 bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-neutral-700 bg-neutral-900">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-px mt-3 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-700 text-center">
            <div className="bg-neutral-900 px-2 py-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500">{bt(lang, 'framesCaptured')}</div>
              <div className="font-mono text-amber-400">{framesCaptured}</div>
            </div>
            <div className="bg-neutral-900 px-2 py-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500">{bt(lang, 'blocksResolved')}</div>
              <div className="font-mono text-amber-400">{blocksLine}</div>
            </div>
            <div className="bg-neutral-900 px-2 py-2">
              <div className="text-[10px] uppercase tracking-wide text-neutral-500">{bt(lang, 'progress')}</div>
              <div className="font-mono text-amber-400">{progress}%</div>
            </div>
          </div>

          <p className="mt-3 text-xs text-neutral-500">{bt(lang, 'steadyHint')}</p>

          <button type="button" onClick={stop} className="mt-3 w-full rounded-lg border border-neutral-700 px-4 py-2.5 font-medium text-neutral-200 hover:bg-neutral-800">
            {bt(lang, 'stopCamera')}
          </button>
        </div>
      )}
    </div>
  );
}
