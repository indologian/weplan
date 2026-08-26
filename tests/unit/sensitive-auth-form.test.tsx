// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SensitiveAuthForm } from "@/modules/auth/components/sensitive-auth-form";

describe("SensitiveAuthForm", () => {
  afterEach(() => cleanup());

  it("issues re-authentication and notifies the protected workflow only on success", async () => {
    const issueSensitiveAuth = vi.fn().mockResolvedValue({
      success: true,
      data: { expiresAt: "2026-08-26T12:10:00.000Z" },
    });
    const onAuthenticated = vi.fn();
    render(
      <SensitiveAuthForm
        issueSensitiveAuth={issueSensitiveAuth}
        onAuthenticated={onAuthenticated}
      />,
    );

    fireEvent.change(screen.getByLabelText("Password akun"), {
      target: { value: "correct-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verifikasi" }));

    await waitFor(() =>
      expect(issueSensitiveAuth).toHaveBeenCalledWith({
        password: "correct-password",
      }),
    );
    expect(onAuthenticated).toHaveBeenCalledOnce();
    expect(
      (screen.getByLabelText("Password akun") as HTMLInputElement).value,
    ).toBe("");
    expect(
      screen.getByText(/Re-authentication berhasil/).textContent,
    ).toContain("Re-authentication berhasil");
  });

  it("keeps the workflow unauthenticated when re-authentication fails", async () => {
    const issueSensitiveAuth = vi.fn().mockResolvedValue({
      success: false,
      code: "FORBIDDEN",
      error: "Re-authentication gagal.",
    });
    const onAuthenticated = vi.fn();
    render(
      <SensitiveAuthForm
        issueSensitiveAuth={issueSensitiveAuth}
        onAuthenticated={onAuthenticated}
      />,
    );

    fireEvent.change(screen.getByLabelText("Password akun"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verifikasi" }));

    await waitFor(() =>
      expect(screen.getByText("Re-authentication gagal.").textContent).toBe(
        "Re-authentication gagal.",
      ),
    );
    expect(onAuthenticated).not.toHaveBeenCalled();
    expect(
      (screen.getByLabelText("Password akun") as HTMLInputElement).value,
    ).toBe("wrong-password");
  });
});
