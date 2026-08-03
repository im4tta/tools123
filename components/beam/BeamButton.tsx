'use client';
// components/beam/BeamButton.tsx
import React, { useState } from 'react';
import { useBeam } from '../../contexts/BeamContext';
import type { BeamSendPayload } from '../../lib/beam/types';

export interface BeamButtonProps {
  /**
   * Produce the payload to send, computed lazily on click so tools don't
   * pay any cost until the user actually taps Beam. Can be sync or async
   * (e.g. reading a canvas, serializing app state, compressing first).
   */
  getPayload: () => BeamSendPayload | Promise<BeamSendPayload>;
  label?: string;
  className?: string;
}

const defaultClass =
  'inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 ' +
  'bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-600 ' +
  'hover:bg-amber-500/20 dark:text-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * Drop this into any Tools123 tool's output area:
 *
 *   <BeamButton getPayload={() => ({
 *     kind: 'file',
 *     bytes: new Uint8Array(await blob.arrayBuffer()),
 *     filename: 'result.pdf',
 *     mime: 'application/pdf',
 *   })} />
 *
 * Requires a <BeamProvider> higher up the tree (mount once in the root
 * layout).
 */
export function BeamButton({ getPayload, label = 'Beam', className }: BeamButtonProps) {
  const { openSend } = useBeam();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      const payload = await getPayload();
      openSend(payload);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={busy} className={className ?? defaultClass}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
      </svg>
      {label}
    </button>
  );
}
