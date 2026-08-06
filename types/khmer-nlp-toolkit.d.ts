declare module "khmer-nlp-toolkit" {
  export function segment(input: string, options?: Record<string, unknown>): string[];
  export function splitIntoClusters(input: string): string[];
}
