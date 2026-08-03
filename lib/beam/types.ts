// lib/beam/types.ts
export type BeamSendPayload =
  | { kind: 'file'; bytes: Uint8Array; filename: string; mime: string }
  | { kind: 'text'; text: string; filename?: string };

export interface BeamSettings {
  fps: number;
  blockSize: number;
  ec: 'L' | 'M' | 'Q' | 'H';
}

export const DEFAULT_BEAM_SETTINGS: BeamSettings = {
  fps: 16,
  blockSize: 700,
  ec: 'L',
};
