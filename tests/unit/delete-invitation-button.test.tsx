// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  actionDeleteInvitation: vi.fn(),
  refresh: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess },
}));

import { DeleteInvitationButton } from "@/app/(dashboard)/_components/delete-invitation-button";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DeleteInvitationButton", () => {
  it("explains the soft-delete consequence and can be cancelled", async () => {
    render(<DeleteInvitationButton id="inv-1" invitationName="Ana & Budi" deleteInvitation={mocks.actionDeleteInvitation} />);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(await screen.findByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText(/tidak menghapus data secara permanen/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(mocks.actionDeleteInvitation).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and exposes an inline error when deletion fails", async () => {
    mocks.actionDeleteInvitation.mockResolvedValue({
      success: false,
      code: "TEMPORARY_ERROR",
      error: "Gagal menghapus undangan.",
    });
    render(<DeleteInvitationButton id="inv-1" invitationName="Ana & Budi" deleteInvitation={mocks.actionDeleteInvitation} />);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Hapus Undangan" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Gagal menghapus undangan.");
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("closes and refreshes the dashboard after deletion succeeds", async () => {
    mocks.actionDeleteInvitation.mockResolvedValue({ success: true, data: { success: true } });
    render(<DeleteInvitationButton id="inv-1" invitationName="Ana & Budi" deleteInvitation={mocks.actionDeleteInvitation} />);

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(await screen.findByRole("button", { name: "Hapus Undangan" }));

    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Undangan dihapus dari dashboard.");
  });
});
