import type { RendererComponent, ThemeDefinition } from "./types";

const registry = new Map<string, ThemeDefinition>();

export function registerTheme(definition: ThemeDefinition): void {
  registry.set(definition.key, definition);
}

export function getTheme(key: string): ThemeDefinition | undefined {
  return registry.get(key);
}

export function getRenderer(key: string): RendererComponent | undefined {
  return registry.get(key)?.renderer;
}

export function getAllThemes(): ThemeDefinition[] {
  return [...registry.values()];
}

export function getActiveRendererKeys(): string[] {
  return [...registry.keys()];
}
