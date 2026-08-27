import { describe, expect, it } from "vitest";
import {
  createAuthCallbackUrl,
  getSafeAuthRedirect,
} from "@/modules/auth/redirect";

describe("auth redirect", () => {
  it("keeps internal paths including query and hash", () => {
    expect(getSafeAuthRedirect("/dashboard/abc?tab=theme#preview")).toBe(
      "/dashboard/abc?tab=theme#preview",
    );
  });

  it.each([
    "https://attacker.example/steal",
    "//attacker.example/steal",
    "/\\attacker.example/steal",
    "javascript:alert(1)",
    "/dashboard\nmalformed",
  ])("rejects unsafe redirect %s", (value) => {
    expect(getSafeAuthRedirect(value)).toBe("/dashboard");
  });

  it("builds the canonical PKCE callback URL", () => {
    expect(
      createAuthCallbackUrl(
        "http://localhost:3000",
        "/dashboard/invitation?tab=guest",
      ),
    ).toBe(
      "http://localhost:3000/callback?redirect=%2Fdashboard%2Finvitation%3Ftab%3Dguest",
    );
  });
});
