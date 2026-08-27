export const RENDERER_KEYS = [
  "_baseline",
  "modern-editorial-ivory",
  "romantic-floral-watercolor",
  "javanese-heritage",
  "luxury-midnight",
] as const;

export type RendererKey = (typeof RENDERER_KEYS)[number];

export function isRendererKey(value: string): value is RendererKey {
  return (RENDERER_KEYS as readonly string[]).includes(value);
}
