import type { RendererKey } from "@/config/renderer-keys";
import type { RendererLoader } from "./types";

const rendererRegistry = {
  _baseline: () => import("./themes/_baseline/renderer").then((module) => module.BaselineRenderer),
  "modern-editorial-ivory": () => import("./themes/modern-editorial/renderer").then((module) => module.ModernEditorialRenderer),
  "romantic-floral-watercolor": () => import("./themes/romantic-floral/renderer").then((module) => module.RomanticFloralRenderer),
  "javanese-heritage": () => import("./themes/javanese-heritage/renderer").then((module) => module.JavaneseHeritageRenderer),
  "luxury-midnight": () => import("./themes/luxury-midnight/renderer").then((module) => module.LuxuryMidnightRenderer),
} satisfies Record<RendererKey, RendererLoader>;

export function getRendererLoader(key: string): RendererLoader | undefined {
  return rendererRegistry[key as RendererKey];
}

export function getActiveRendererKeys(): RendererKey[] {
  return Object.keys(rendererRegistry) as RendererKey[];
}
