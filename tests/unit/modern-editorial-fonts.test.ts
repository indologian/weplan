import { describe, expect, it } from "vitest";
import { Plus_Jakarta_Sans } from "next/font/google";
import { weddingDisplay } from "@/shared/fonts";
import { modernEditorialBody, modernEditorialDisplay } from "@/modules/theme/themes/modern-editorial/fonts";

describe("next/font test mock variables", () => {
  it("preserves each caller-owned CSS variable", () => {
    const jakarta = Plus_Jakarta_Sans({
      subsets: ["latin"],
      variable: "--font-jakarta",
    });

    expect(weddingDisplay.variable).toBe("--font-wedding-display");
    expect(modernEditorialDisplay.variable).toBe("--font-modern-editorial-display");
    expect(modernEditorialBody.variable).toBe("--font-modern-editorial-body");
    expect(jakarta.variable).toBe("--font-jakarta");
  });
});
