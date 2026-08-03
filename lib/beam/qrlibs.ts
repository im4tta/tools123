// lib/beam/qrlibs.ts
// Loads qrcode-generator + jsQR from CDN on demand, once, the first time the
// Beam modal actually opens — so the rest of Tools123 never pays for these
// two libraries in its bundle.

declare global {
  interface Window {
    qrcode: (typeNumber: number, ec: 'L' | 'M' | 'Q' | 'H') => {
      addData: (data: string, mode?: 'Byte') => void;
      make: () => void;
      getModuleCount: () => number;
      isDark: (row: number, col: number) => boolean;
    };
    jsQR: (
      data: Uint8ClampedArray,
      width: number,
      height: number,
      opts?: { inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst' }
    ) => { data: string; binaryData: number[]; version: number } | null;
  }
}

const QRCODE_SRC = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
const JSQR_SRC = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-beam-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') resolve();
      else existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.dataset.beamSrc = src;
    s.onload = () => { s.dataset.loaded = 'true'; resolve(); };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

let loadPromise: Promise<void> | null = null;

export function loadBeamLibs(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (typeof window.qrcode === 'function' && typeof window.jsQR === 'function') return Promise.resolve();
  if (!loadPromise) {
    loadPromise = Promise.all([loadScript(QRCODE_SRC), loadScript(JSQR_SRC)]).then(() => undefined);
  }
  return loadPromise;
}
