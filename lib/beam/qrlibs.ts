// lib/beam/qrlibs.ts
// Loads qrcode-generator + jsQR on demand, once, the first time the Beam modal
// actually opens — so the rest of Tools123 never pays for these two libraries
// in its bundle. Both come from the app's own npm dependencies (code-split
// chunks, integrity-checked via package-lock) rather than a third-party CDN.

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

let loadPromise: Promise<void> | null = null;

export function loadBeamLibs(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (typeof window.qrcode === 'function' && typeof window.jsQR === 'function') return Promise.resolve();
  if (!loadPromise) {
    loadPromise = Promise.all([import('qrcode-generator'), import('jsqr')]).then(([qrcode, jsQR]) => {
      // The Beam panels read these as globals; keep that contract.
      window.qrcode = qrcode.default as unknown as typeof window.qrcode;
      window.jsQR = jsQR.default as unknown as Window['jsQR'];
    });
    loadPromise.catch(() => { loadPromise = null; });
  }
  return loadPromise;
}
