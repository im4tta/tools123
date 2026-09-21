declare module "khmer-nlp-toolkit" {
  export function segment(input: string, options?: Record<string, unknown>): string[];
  export function splitIntoClusters(input: string): string[];
  export function normalize(input: string, options?: Record<string, unknown>): string;
  export interface TaggedToken { word: string; tag: string; }
  export function tag(tokens: string[], options?: Record<string, unknown>): TaggedToken[];
  export function process(text: string, options?: Record<string, unknown>): TaggedToken[];
  export const SEED_POS_DICTIONARY: [string, string][];
  export const SEED_DICTIONARY: string[];
}
