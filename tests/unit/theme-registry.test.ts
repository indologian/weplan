import { describe, expect, it } from "vitest";
import "@/modules/theme/init";
import {
  getTheme,
  getRenderer,
  getAllThemes,
  getActiveRendererKeys,
} from "@/modules/theme/registry";

describe("theme registry", () => {
  it("registers all launch themes", () => {
    const keys = getActiveRendererKeys();
    expect(keys).toContain("_baseline");
    expect(keys).toContain("modern-editorial-ivory");
    expect(keys).toContain("romantic-floral-watercolor");
    expect(keys).toContain("javanese-heritage");
    expect(keys).toContain("luxury-midnight");
  });

  it("returns theme definition for each registered key", () => {
    const themes = getAllThemes();
    expect(themes.length).toBeGreaterThanOrEqual(5);

    for (const theme of themes) {
      expect(theme.key).toBeTruthy();
      expect(theme.name).toBeTruthy();
      expect(theme.renderer).toBeDefined();
      expect(theme.spec).toBeDefined();
      expect(theme.spec.palette).toBeDefined();
      expect(theme.spec.typography).toBeDefined();
    }
  });

  it("returns a renderer component for each registered key", () => {
    const keys = getActiveRendererKeys();
    for (const key of keys) {
      const renderer = getRenderer(key);
      expect(renderer).toBeDefined();
      expect(typeof renderer).toBe("function");
    }
  });

  it("returns undefined for unknown renderer key", () => {
    expect(getRenderer("nonexistent-theme")).toBeUndefined();
    expect(getTheme("nonexistent-theme")).toBeUndefined();
  });

  it("each theme has distinct palette", () => {
    const themes = getAllThemes();
    const backgrounds = themes.map((t) => t.spec.palette.background);
    const uniqueBackgrounds = new Set(backgrounds);
    expect(uniqueBackgrounds.size).toBe(themes.length);
  });

  it("each theme has distinct art direction archetype", () => {
    const themes = getAllThemes();
    const archetypes = themes.map((t) => t.spec.artDirection.archetype);
    const uniqueArchetypes = new Set(archetypes);
    expect(uniqueArchetypes.size).toBe(themes.length);
  });
});
