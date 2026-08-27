import { describe, expect, it } from "vitest";
import { RENDERER_KEYS } from "@/config/renderer-keys";
import { getActiveRendererKeys, getRendererLoader } from "@/modules/theme/registry";

describe("theme renderer registry", () => {
  it("maps every canonical renderer key exactly once", () => {
    expect(getActiveRendererKeys()).toEqual([...RENDERER_KEYS]);
  });

  it("loads a renderer for every canonical key", async () => {
    for (const key of RENDERER_KEYS) {
      const loader = getRendererLoader(key);
      expect(loader).toBeTypeOf("function");
      await expect(loader?.()).resolves.toBeTypeOf("function");
    }
  });

  it("returns undefined for an unknown key", () => {
    expect(getRendererLoader("unknown-theme")).toBeUndefined();
  });
});
