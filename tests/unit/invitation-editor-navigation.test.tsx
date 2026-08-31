/**
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InvitationEditorWorkspace } from "@/modules/invitation/components/editor/invitation-editor-workspace";
import type { EditorDTO } from "@/modules/invitation/types";

const mocks = vi.hoisted(() => ({
  flushAll: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/modules/invitation/components/editor/editor-workspace-context", () => ({
  useEditorWorkspace: () => ({
    conflictState: false,
    flushAll: mocks.flushAll,
  }),
}));

vi.mock("@/modules/invitation/components/editor/editor-step-navigation", () => ({
  EditorStepNavigation: ({ onChange }: { onChange: (step: number) => void }) => (
    <button type="button" onClick={() => void onChange(4)}>
      Buka langkah terakhir
    </button>
  ),
}));

vi.mock("@/modules/invitation/components/editor/editor-publish-readiness", () => ({
  EditorPublishReadiness: () => null,
}));

vi.mock("@/modules/invitation/components/editor/steps/profile-prayer-step", () => ({
  ProfilePrayerStep: () => <div>Profil</div>,
}));

vi.mock("@/modules/invitation/components/editor/steps/event-step", () => ({
  EventStep: () => <div>Acara</div>,
}));

vi.mock("@/modules/invitation/components/editor/steps/story-gallery-step", () => ({
  StoryGalleryStep: () => <div>Galeri</div>,
}));

vi.mock("@/modules/invitation/components/editor/steps/advanced-settings-step", () => ({
  AdvancedSettingsStep: () => <div>Pengaturan Lanjutan</div>,
}));

const initialData = {
  invitationId: "10000000-0000-4000-8000-000000000001",
  slug: "preview-navigation-fixture",
  status: "draft",
  isPrivate: false,
  rsvpMode: "personal_only",
  guestbookModeration: "auto",
  couple: {
    groom: { name: "Groom", parentNames: [] },
    bride: { name: "Bride", parentNames: [] },
  },
  loveStory: [],
  bankAccounts: [],
  settings: {},
  contentVersion: 10,
  expiresAt: null,
  entitlementTierId: null,
  themeId: "30000000-0000-4000-8000-000000000003",
  events: [],
  gallery: [],
} satisfies EditorDTO;

const noopAction = vi.fn() as never;

describe("InvitationEditorWorkspace navigation", () => {
  beforeEach(() => {
    mocks.flushAll.mockReset().mockResolvedValue({
      success: true,
      contentVersion: 10,
    });
    mocks.push.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("replaces Lanjut with Preview on the last step and flushes before navigating", async () => {
    render(
      <InvitationEditorWorkspace
        initialData={initialData}
        saveEditorContent={noopAction}
        saveEditorEvent={noopAction}
        deleteEditorEvent={noopAction}
        reorderEditorEvents={noopAction}
        replaceEditorGallery={noopAction}
        issueSensitiveAuth={noopAction}
        updateEditorPrivacy={noopAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buka langkah terakhir" }));
    await screen.findByRole("button", { name: "Preview" });

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith(
        "/preview/10000000-0000-4000-8000-000000000001",
      );
    });
    expect(mocks.flushAll).toHaveBeenCalledTimes(2);
    expect(mocks.flushAll.mock.invocationCallOrder[1]!).toBeLessThan(
      mocks.push.mock.invocationCallOrder[0]!,
    );
  });

  it("does not open Preview when the final editor flush fails", async () => {
    mocks.flushAll
      .mockResolvedValueOnce({ success: true, contentVersion: 10 })
      .mockResolvedValueOnce({ success: false, contentVersion: 10 });

    render(
      <InvitationEditorWorkspace
        initialData={initialData}
        saveEditorContent={noopAction}
        saveEditorEvent={noopAction}
        deleteEditorEvent={noopAction}
        reorderEditorEvents={noopAction}
        replaceEditorGallery={noopAction}
        issueSensitiveAuth={noopAction}
        updateEditorPrivacy={noopAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buka langkah terakhir" }));
    await screen.findByRole("button", { name: "Preview" });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    await waitFor(() => {
      expect(mocks.flushAll).toHaveBeenCalledTimes(2);
    });
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
