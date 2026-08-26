// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InvitationEditor } from "@/modules/invitation/components/invitation-editor";
import type { EditorDTO } from "@/modules/invitation/types";

const invitation: EditorDTO = {
  invitationId: "7e66e3c1-595f-4fe3-940e-1085e717754f",
  slug: "w-example",
  status: "draft",
  isPrivate: false,
  rsvpMode: "personal_only",
  guestbookModeration: "auto",
  couple: { groom: { name: "A" }, bride: { name: "B" } },
  loveStory: [],
  bankAccounts: [],
  settings: {},
  contentVersion: 1,
  expiresAt: null,
  themeId: "1762fcd3-b076-439a-bade-33743a51063f",
  events: [],
};

function createEventActions(overrides?: {
  saveVersion?: number;
  deleteVersion?: number;
  reorderVersion?: number;
}) {
  return {
    saveEditorEvent: vi.fn().mockResolvedValue({
      success: true,
      data: {
        contentVersion: overrides?.saveVersion ?? 2,
        eventId: "2fce4f09-b277-426d-b049-368712697097",
      },
    }),
    deleteEditorEvent: vi.fn().mockResolvedValue({
      success: true,
      data: { contentVersion: overrides?.deleteVersion ?? 2 },
    }),
    reorderEditorEvents: vi.fn().mockResolvedValue({
      success: true,
      data: { contentVersion: overrides?.reorderVersion ?? 2 },
    }),
  };
}

describe("InvitationEditor — content autosave", () => {
  afterEach(() => cleanup());

  it("persists the changed form snapshot after the debounce", async () => {
    const saveEditorContent = vi
      .fn()
      .mockResolvedValue({ success: true, data: { contentVersion: 2 } });
    render(
      <InvitationEditor
        initialData={invitation}
        saveEditorContent={saveEditorContent}
        {...createEventActions()}
        issueSensitiveAuth={vi.fn()}
        updateEditorPrivacy={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nama mempelai pria"), {
      target: { value: "C" },
    });

    await waitFor(
      () =>
        expect(saveEditorContent).toHaveBeenCalledWith(
          expect.objectContaining({
            expectedVersion: 1,
            couple: expect.objectContaining({
              groom: expect.objectContaining({ name: "C" }),
            }),
          }),
        ),
      { timeout: 1500 },
    );
  });

  it("keeps a persistent conflict state when the CAS rejects the save", async () => {
    const saveEditorContent = vi
      .fn()
      .mockResolvedValue({
        success: false,
        code: "VERSION_CONFLICT",
        error: "conflict",
      });
    render(
      <InvitationEditor
        initialData={invitation}
        saveEditorContent={saveEditorContent}
        {...createEventActions()}
        issueSensitiveAuth={vi.fn()}
        updateEditorPrivacy={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nama mempelai wanita"), {
      target: { value: "D" },
    });

    await waitFor(
      () => expect(screen.getByText("Perubahan di tempat lain")).toBeTruthy(),
      { timeout: 1500 },
    );
    expect(saveEditorContent).toHaveBeenCalledTimes(1);
  });

  it("shows the confirm-reload dialog when user clicks Muat versi terbaru", async () => {
    const saveEditorContent = vi
      .fn()
      .mockResolvedValue({
        success: false,
        code: "VERSION_CONFLICT",
        error: "conflict",
      });
    render(
      <InvitationEditor
        initialData={invitation}
        saveEditorContent={saveEditorContent}
        {...createEventActions()}
        issueSensitiveAuth={vi.fn()}
        updateEditorPrivacy={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nama mempelai pria"), {
      target: { value: "X" },
    });

    const loadButton = await screen.findByText("Muat versi terbaru", {}, { timeout: 2000 });
    fireEvent.click(loadButton);

    expect(
      screen.getByText(/Perubahan lokal yang belum tersimpan akan diganti/),
    ).toBeTruthy();
    expect(screen.getByText("Lanjutkan")).toBeTruthy();
    expect(screen.getByText("Batal")).toBeTruthy();
  });

  it("cancels the reload dialog when Batal is clicked", async () => {
    const saveEditorContent = vi
      .fn()
      .mockResolvedValue({
        success: false,
        code: "VERSION_CONFLICT",
        error: "conflict",
      });
    render(
      <InvitationEditor
        initialData={invitation}
        saveEditorContent={saveEditorContent}
        {...createEventActions()}
        issueSensitiveAuth={vi.fn()}
        updateEditorPrivacy={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nama mempelai pria"), {
      target: { value: "X" },
    });

    const loadButton = await screen.findByText("Muat versi terbaru", {}, { timeout: 2000 });
    fireEvent.click(loadButton);
    expect(screen.getByText("Lanjutkan")).toBeTruthy();

    fireEvent.click(screen.getByText("Batal"));
    expect(screen.queryByText("Lanjutkan")).toBeNull();
  });

  it("disables the submit button while saving", async () => {
    let resolveSave: ((v: { success: true; data: { contentVersion: number } }) => void) | undefined;
    const saveEditorContent = vi.fn().mockImplementation(
      () =>
        new Promise<{ success: true; data: { contentVersion: number } }>(
          (resolve) => {
            resolveSave = resolve;
          },
        ),
    );
    render(
      <InvitationEditor
        initialData={invitation}
        saveEditorContent={saveEditorContent}
        {...createEventActions()}
        issueSensitiveAuth={vi.fn()}
        updateEditorPrivacy={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nama mempelai pria"), {
      target: { value: "C" },
    });

    await waitFor(() => expect(saveEditorContent).toHaveBeenCalled(), {
      timeout: 1500,
    });

    const button = screen.getByRole("button", { name: "Simpan sekarang" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    resolveSave?.({ success: true, data: { contentVersion: 2 } });
    await waitFor(() => {
      expect((screen.getByRole("button", { name: "Simpan sekarang" }) as HTMLButtonElement).disabled).toBe(false);
    });
  });
});

describe("InvitationEditor — event CRUD", () => {
  afterEach(() => cleanup());

  it("adds a new event block and saves it to the server", async () => {
    const actions = createEventActions();
    render(
      <InvitationEditor
        initialData={invitation}
        saveEditorContent={vi.fn().mockResolvedValue({
          success: true,
          data: { contentVersion: 2 },
        })}
        {...actions}
        issueSensitiveAuth={vi.fn()}
        updateEditorPrivacy={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Tambah acara"));

    const titleInput = screen.getAllByLabelText("Nama acara");
    expect(titleInput).toHaveLength(1);

    fireEvent.change(titleInput[0], { target: { value: "Akad Nikah" } });
    fireEvent.change(
      screen.getAllByLabelText("Waktu ISO dengan offset")[0],
      { target: { value: "2026-10-15T08:00:00+07:00" } },
    );
    fireEvent.change(screen.getAllByLabelText("Timezone IANA")[0], {
      target: { value: "Asia/Jakarta" },
    });

    fireEvent.click(screen.getByText("Simpan acara"));

    await waitFor(() =>
      expect(actions.saveEditorEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          invitationId: invitation.invitationId,
          expectedVersion: 1,
          data: expect.objectContaining({
            title: "Akad Nikah",
            startsAt: "2026-10-15T08:00:00+07:00",
            timezone: "Asia/Jakarta",
          }),
        }),
      ),
    );

    expect(screen.getByText("Acara tersimpan")).toBeTruthy();
  });

  it("deletes an existing event and updates the list", async () => {
    const actions = createEventActions();
    const invitationWithEvent: EditorDTO = {
      ...invitation,
      contentVersion: 2,
      events: [
        {
          eventId: "evt-1",
          position: 0,
          eventType: "other",
          title: "Resepsi",
          startsAt: "2026-10-15T10:00:00+07:00",
          endsAt: null,
          timezone: "Asia/Jakarta",
          venueName: "Hotel X",
          address: "Jl. Sudirman",
          latitude: null,
          longitude: null,
        },
      ],
    };

    render(
      <InvitationEditor
        initialData={invitationWithEvent}
        saveEditorContent={vi.fn().mockResolvedValue({
          success: true,
          data: { contentVersion: 3 },
        })}
        {...actions}
        issueSensitiveAuth={vi.fn()}
        updateEditorPrivacy={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Resepsi")).toBeTruthy();

    fireEvent.click(screen.getByText("Hapus acara"));

    await waitFor(() =>
      expect(actions.deleteEditorEvent).toHaveBeenCalledWith({
        invitationId: invitation.invitationId,
        expectedVersion: 2,
        eventId: "evt-1",
      }),
    );

    expect(screen.getByText("Acara dihapus")).toBeTruthy();
    expect(screen.queryByDisplayValue("Resepsi")).toBeNull();
  });

  it("prevents reordering when not all events have server IDs", async () => {
    const actions = createEventActions();
    const invitationWithTwoEvents: EditorDTO = {
      ...invitation,
      contentVersion: 2,
      events: [
        {
          eventId: "evt-1",
          position: 0,
          eventType: "other",
          title: "Akad",
          startsAt: "2026-10-15T08:00:00+07:00",
          endsAt: null,
          timezone: "Asia/Jakarta",
          venueName: "",
          address: "",
          latitude: null,
          longitude: null,
        },
        {
          eventId: "evt-2",
          position: 1,
          eventType: "other",
          title: "Resepsi",
          startsAt: "2026-10-15T10:00:00+07:00",
          endsAt: null,
          timezone: "Asia/Jakarta",
          venueName: "",
          address: "",
          latitude: null,
          longitude: null,
        },
      ],
    };

    render(
      <InvitationEditor
        initialData={invitationWithTwoEvents}
        saveEditorContent={vi.fn().mockResolvedValue({
          success: true,
          data: { contentVersion: 3 },
        })}
        {...actions}
        issueSensitiveAuth={vi.fn()}
        updateEditorPrivacy={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Tambah acara"));

    const downButtons = screen.getAllByText("Turun");
    fireEvent.click(downButtons[0]);

    expect(screen.getByText("Simpan semua acara baru sebelum mengubah urutan.")).toBeTruthy();
    expect(actions.reorderEditorEvents).not.toHaveBeenCalled();
  });

  it("reorders saved events and updates the server", async () => {
    const actions = createEventActions({ reorderVersion: 3 });
    const invitationWithEvents: EditorDTO = {
      ...invitation,
      contentVersion: 2,
      events: [
        {
          eventId: "evt-1",
          position: 0,
          eventType: "other",
          title: "Akad",
          startsAt: "2026-10-15T08:00:00+07:00",
          endsAt: null,
          timezone: "Asia/Jakarta",
          venueName: "",
          address: "",
          latitude: null,
          longitude: null,
        },
        {
          eventId: "evt-2",
          position: 1,
          eventType: "other",
          title: "Resepsi",
          startsAt: "2026-10-15T10:00:00+07:00",
          endsAt: null,
          timezone: "Asia/Jakarta",
          venueName: "",
          address: "",
          latitude: null,
          longitude: null,
        },
      ],
    };

    render(
      <InvitationEditor
        initialData={invitationWithEvents}
        saveEditorContent={vi.fn().mockResolvedValue({
          success: true,
          data: { contentVersion: 3 },
        })}
        {...actions}
        issueSensitiveAuth={vi.fn()}
        updateEditorPrivacy={vi.fn()}
      />,
    );

    const downButtons = screen.getAllByText("Turun");
    fireEvent.click(downButtons[0]);

    await waitFor(() =>
      expect(actions.reorderEditorEvents).toHaveBeenCalledWith({
        invitationId: invitation.invitationId,
        expectedVersion: 2,
        eventIds: ["evt-2", "evt-1"],
      }),
    );

    expect(screen.getByText("Urutan acara tersimpan")).toBeTruthy();
  });

  it("displays server error when event save fails", async () => {
    const actions = createEventActions();
    actions.saveEditorEvent.mockResolvedValue({
      success: false,
      code: "VALIDATION_ERROR",
      error: "Judul acara wajib diisi.",
    });

    render(
      <InvitationEditor
        initialData={invitation}
        saveEditorContent={vi.fn().mockResolvedValue({
          success: true,
          data: { contentVersion: 2 },
        })}
        {...actions}
        issueSensitiveAuth={vi.fn()}
        updateEditorPrivacy={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Tambah acara"));
    fireEvent.click(screen.getByText("Simpan acara"));

    await waitFor(() =>
      expect(screen.getByText("Judul acara wajib diisi.")).toBeTruthy(),
    );
  });
});

describe("InvitationEditor — privacy toggle with sensitive auth", () => {
  afterEach(() => cleanup());

  it("requires re-authentication before saving privacy changes", async () => {
    const updateEditorPrivacy = vi.fn().mockResolvedValue({
      success: true,
      data: { contentVersion: 2 },
    });
    const issueSensitiveAuth = vi.fn().mockResolvedValue({
      success: true,
      data: { expiresAt: "2026-08-26T12:10:00.000Z" },
    });

    render(
      <InvitationEditor
        initialData={invitation}
        saveEditorContent={vi.fn().mockResolvedValue({
          success: true,
          data: { contentVersion: 2 },
        })}
        {...createEventActions()}
        issueSensitiveAuth={issueSensitiveAuth}
        updateEditorPrivacy={updateEditorPrivacy}
      />,
    );

    fireEvent.click(
      screen.getByLabelText("Gunakan PIN untuk undangan ini"),
    );

    expect(
      screen.getByText("Verifikasi tindakan sensitif"),
    ).toBeTruthy();

    expect(
      screen.queryByText("Simpan pengaturan privasi"),
    ).toBeNull();

    fireEvent.change(screen.getByLabelText("Password akun"), {
      target: { value: "my-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verifikasi" }));

    await waitFor(() =>
      expect(issueSensitiveAuth).toHaveBeenCalledWith({
        password: "my-password",
      }),
    );

    expect(screen.getByText("Simpan pengaturan privasi")).toBeTruthy();
  });

  it("sends privacy mutation only after re-auth succeeds", async () => {
    const updateEditorPrivacy = vi.fn().mockResolvedValue({
      success: true,
      data: { contentVersion: 2 },
    });
    const issueSensitiveAuth = vi.fn().mockResolvedValue({
      success: true,
      data: { expiresAt: "2026-08-26T12:10:00.000Z" },
    });

    render(
      <InvitationEditor
        initialData={invitation}
        saveEditorContent={vi.fn().mockResolvedValue({
          success: true,
          data: { contentVersion: 2 },
        })}
        {...createEventActions()}
        issueSensitiveAuth={issueSensitiveAuth}
        updateEditorPrivacy={updateEditorPrivacy}
      />,
    );

    fireEvent.click(
      screen.getByLabelText("Gunakan PIN untuk undangan ini"),
    );
    fireEvent.change(screen.getByLabelText("Password akun"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verifikasi" }));

    await waitFor(() =>
      expect(issueSensitiveAuth).toHaveBeenCalled(),
    );

    expect(updateEditorPrivacy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Simpan pengaturan privasi"));

    await waitFor(() =>
      expect(updateEditorPrivacy).toHaveBeenCalledWith(
        expect.objectContaining({
          invitationId: invitation.invitationId,
          isPrivate: true,
        }),
      ),
    );

    expect(screen.getByText("Pengaturan privasi tersimpan.")).toBeTruthy();
  });

  it("shows error when privacy save fails", async () => {
    const updateEditorPrivacy = vi.fn().mockResolvedValue({
      success: false,
      code: "INVALID_STATE",
      error: "PIN harus 6-10 digit numerik.",
    });
    const issueSensitiveAuth = vi.fn().mockResolvedValue({
      success: true,
      data: { expiresAt: "2026-08-26T12:10:00.000Z" },
    });

    render(
      <InvitationEditor
        initialData={invitation}
        saveEditorContent={vi.fn().mockResolvedValue({
          success: true,
          data: { contentVersion: 2 },
        })}
        {...createEventActions()}
        issueSensitiveAuth={issueSensitiveAuth}
        updateEditorPrivacy={updateEditorPrivacy}
      />,
    );

    fireEvent.click(
      screen.getByLabelText("Gunakan PIN untuk undangan ini"),
    );
    fireEvent.change(screen.getByLabelText("Password akun"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verifikasi" }));
    await waitFor(() => expect(issueSensitiveAuth).toHaveBeenCalled());

    fireEvent.click(screen.getByText("Simpan pengaturan privasi"));

    await waitFor(() =>
      expect(
        screen.getByText("PIN harus 6-10 digit numerik."),
      ).toBeTruthy(),
    );
  });

  it("shows error when re-authentication fails", async () => {
    const issueSensitiveAuth = vi.fn().mockResolvedValue({
      success: false,
      code: "FORBIDDEN",
      error: "Re-authentication gagal.",
    });

    render(
      <InvitationEditor
        initialData={invitation}
        saveEditorContent={vi.fn().mockResolvedValue({
          success: true,
          data: { contentVersion: 2 },
        })}
        {...createEventActions()}
        issueSensitiveAuth={issueSensitiveAuth}
        updateEditorPrivacy={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByLabelText("Gunakan PIN untuk undangan ini"),
    );
    fireEvent.change(screen.getByLabelText("Password akun"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verifikasi" }));

    await waitFor(() =>
      expect(screen.getByText("Re-authentication gagal.")).toBeTruthy(),
    );
  });
});
