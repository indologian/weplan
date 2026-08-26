/**
 * M3 owns concrete renderer registrations. Keeping this empty until a renderer
 * is actually imported makes theme activation and publish readiness fail closed.
 */
export const KNOWN_RENDERER_KEYS: ReadonlySet<string> = new Set();

export function getKnownRendererKeys(): string[] {
  return [...KNOWN_RENDERER_KEYS];
}
