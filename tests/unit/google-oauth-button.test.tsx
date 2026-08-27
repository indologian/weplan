// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleOAuthButton } from "@/modules/auth/components/google-oauth-button";

const { signInWithOAuth } = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/browser-client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: { signInWithOAuth },
  }),
}));

describe("GoogleOAuthButton", () => {
  afterEach(() => {
    cleanup();
    signInWithOAuth.mockReset();
  });

  it("starts Google PKCE login with the canonical callback", async () => {
    signInWithOAuth.mockResolvedValue({ error: null });
    render(<GoogleOAuthButton redirectTo="/dashboard/demo?tab=theme" />);

    fireEvent.click(screen.getByRole("button", { name: "Lanjutkan dengan Google" }));

    await waitFor(() =>
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo:
            "http://localhost:3000/callback?redirect=%2Fdashboard%2Fdemo%3Ftab%3Dtheme",
        },
      }),
    );
  });

  it("shows a safe message when OAuth cannot start", async () => {
    signInWithOAuth.mockResolvedValue({ error: new Error("provider disabled") });
    render(<GoogleOAuthButton redirectTo="/dashboard" />);

    fireEvent.click(screen.getByRole("button", { name: "Lanjutkan dengan Google" }));

    expect(
      await screen.findByText("Login Google belum dapat dimulai. Silakan coba lagi."),
    ).toBeTruthy();
  });
});
