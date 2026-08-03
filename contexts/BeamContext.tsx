'use client';
// contexts/BeamContext.tsx
import React, { createContext, useCallback, useContext, useState } from 'react';
import type { BeamSendPayload } from '../lib/beam/types';
import { BeamModal } from '../components/beam/BeamModal';
import type { BeamLang } from '../lib/beam/i18n';

interface BeamContextValue {
  /** Open the Beam modal pre-loaded with a file or text payload to send. */
  openSend: (payload: BeamSendPayload) => void;
  /** Open the Beam modal on the Receive tab, camera ready to go. */
  openReceive: () => void;
}

const BeamContext = createContext<BeamContextValue | null>(null);

/** Call from any tool: const { openSend } = useBeam(); */
export function useBeam(): BeamContextValue {
  const ctx = useContext(BeamContext);
  if (!ctx) throw new Error('useBeam() must be called inside <BeamProvider>');
  return ctx;
}

export interface BeamProviderProps {
  children: React.ReactNode;
  /**
   * Optional: pass Tools123's own current language in ('en' | 'km') if you
   * want the Beam modal to follow the app's existing language toggle
   * instead of remembering its own. Falls back to localStorage otherwise.
   */
  lang?: BeamLang;
}

export function BeamProvider({ children, lang }: BeamProviderProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'send' | 'receive'>('send');
  const [payload, setPayload] = useState<BeamSendPayload | null>(null);

  const openSend = useCallback((p: BeamSendPayload) => {
    setPayload(p);
    setMode('send');
    setOpen(true);
  }, []);

  const openReceive = useCallback(() => {
    setPayload(null);
    setMode('receive');
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return (
    <BeamContext.Provider value={{ openSend, openReceive }}>
      {children}
      {open && (
        <BeamModal
          initialMode={mode}
          payload={payload}
          forcedLang={lang}
          onClose={close}
        />
      )}
    </BeamContext.Provider>
  );
}
