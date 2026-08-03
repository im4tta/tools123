'use client';
// components/beam/BeamModal.tsx
import React, { useEffect, useState } from 'react';
import { SendPanel } from './SendPanel';
import { ReceivePanel } from './ReceivePanel';
import { bt, type BeamLang } from '../../lib/beam/i18n';
import type { BeamSendPayload } from '../../lib/beam/types';

export interface BeamModalProps {
  initialMode: 'send' | 'receive';
  payload: BeamSendPayload | null;
  onClose: () => void;
  /** Pass Tools123's own language if you want Beam to follow it instead of its own toggle. */
  forcedLang?: BeamLang;
}

export function BeamModal({ initialMode, payload, onClose, forcedLang }: BeamModalProps) {
  const [mode, setMode] = useState<'send' | 'receive'>(initialMode);
  const [ownLang, setOwnLang] = useState<BeamLang>(() => {
    if (typeof window === 'undefined') return 'en';
    return (window.localStorage.getItem('beam-lang') as BeamLang) || 'en';
  });
  const lang = forcedLang ?? ownLang;

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function changeLang(l: BeamLang) {
    setOwnLang(l);
    window.localStorage.setItem('beam-lang', l);
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-neutral-700 bg-neutral-950 p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={bt(lang, 'beamTitle')}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400 shadow-[0_0_10px_2px_rgba(251,191,36,0.6)]" />
            <span className="font-semibold text-neutral-100">{bt(lang, 'beamTitle')}</span>
          </div>
          <div className="flex items-center gap-2">
            {!forcedLang && (
              <div className="flex rounded-full border border-neutral-700 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => changeLang('en')}
                  className={`rounded-full px-2 py-0.5 ${lang === 'en' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400'}`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => changeLang('km')}
                  className={`rounded-full px-2 py-0.5 ${lang === 'km' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400'}`}
                >
                  ខ្មែរ
                </button>
              </div>
            )}
            <button type="button" onClick={onClose} aria-label={bt(lang, 'close')} className="text-neutral-500 hover:text-neutral-200">
              ✕
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-1 rounded-lg bg-neutral-900 p-1">
          <button
            type="button"
            onClick={() => setMode('send')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium ${mode === 'send' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500'}`}
          >
            {bt(lang, 'sendTab')}
          </button>
          <button
            type="button"
            onClick={() => setMode('receive')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium ${mode === 'receive' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500'}`}
          >
            {bt(lang, 'receiveTab')}
          </button>
        </div>

        {mode === 'send' ? <SendPanel payload={payload} lang={lang} /> : <ReceivePanel lang={lang} />}
      </div>
    </div>
  );
}
