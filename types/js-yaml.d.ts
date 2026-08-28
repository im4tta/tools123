// Ambient typings for js-yaml v4 (no bundled types, no @types package).
// js-yaml v4 is present as a dependency tree package; see package-lock.json.
declare module "js-yaml" {
  export class YAMLException extends Error {
    reason: string;
    mark: { name?: string; line: number; column: number; snippet?: string } | null;
  }
  export function load(input: string, options?: Record<string, unknown>): unknown;
  export function dump(input: unknown, options?: Record<string, unknown>): string;
  const jsyaml: {
    load: typeof load;
    dump: typeof dump;
    YAMLException: typeof YAMLException;
  };
  export default jsyaml;
}
