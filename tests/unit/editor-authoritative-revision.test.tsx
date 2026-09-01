/**
 * @vitest-environment jsdom
 */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditorWorkspaceProvider, useEditorWorkspace } from "@/modules/invitation/components/editor/editor-workspace-context";
import { ProfilePrayerStep } from "@/modules/invitation/components/editor/steps/profile-prayer-step";
import { StoryGalleryStep } from "@/modules/invitation/components/editor/steps/story-gallery-step";
import type { EditorDTO } from "@/modules/invitation/types";

vi.mock("@/modules/storage/components/media-uploader", () => ({
  MediaUploader: ({
    purpose,
    onSuccess,
  }: {
    purpose: string;
    onSuccess?: (mediaId: string) => void;
  }) => (
    <button type="button" onClick={() => onSuccess?.(`media-${purpose}`)}>
      upload-{purpose}
    </button>
  ),
}));

const initialData = {
  invitationId: "10000000-0000-4000-8000-000000000001",
  slug: "revision-fixture",
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
} as EditorDTO;

function RevisionProbe() {
  const { contentVersion } = useEditorWorkspace();
  return <output aria-label="workspace revision">{contentVersion}</output>;
}

async function runAutosaveDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
}

describe("editor authoritative revision coordination", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("commits a successful Profile revision and uses it for the next mutation", async () => {
    const saveEditorContent = vi.fn()
      .mockResolvedValueOnce({ success: true, data: { contentVersion: 11 } })
      .mockResolvedValueOnce({ success: true, data: { contentVersion: 12 } });

    render(
      <EditorWorkspaceProvider initialVersion={10}>
        <ProfilePrayerStep
          initialData={initialData}
          saveEditorContent={saveEditorContent}
        />
        <RevisionProbe />
      </EditorWorkspaceProvider>,
    );

    fireEvent.change(screen.getAllByLabelText("Nama Panggilan")[0]!, {
      target: { value: "Groom 11" },
    });
    await runAutosaveDebounce();

    expect(screen.getByLabelText("workspace revision").textContent).toBe("11");

    fireEvent.change(screen.getAllByLabelText("Nama Panggilan")[0]!, {
      target: { value: "Groom 12" },
    });
    await runAutosaveDebounce();

    expect(saveEditorContent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ expectedVersion: 11 }),
    );
    expect(screen.getByLabelText("workspace revision").textContent).toBe("12");
  });

  it("commits Gallery revision immediately and exposes it to the next section mutation", async () => {
    const saveEditorContent = vi.fn()
      .mockResolvedValueOnce({ success: true, data: { contentVersion: 12 } });
    const replaceEditorGallery = vi.fn()
      .mockResolvedValueOnce({ success: true, data: { contentVersion: 11 } });

    render(
      <EditorWorkspaceProvider initialVersion={10}>
        <StoryGalleryStep
          invitationId={initialData.invitationId}
          initialData={initialData}
          saveEditorContent={saveEditorContent}
          replaceEditorGallery={replaceEditorGallery}
        />
        <RevisionProbe />
      </EditorWorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "upload-gallery" }));
    await runAutosaveDebounce();

    expect(replaceEditorGallery).toHaveBeenCalledWith(expect.objectContaining({
      expectedVersion: 10,
    }));
    expect(screen.getByLabelText("workspace revision").textContent).toBe("11");

    fireEvent.click(screen.getByRole("button", { name: /Tambah Cerita/ }));
    fireEvent.change(screen.getByPlaceholderText("Contoh: Pertama Kali Bertemu"), {
      target: { value: "Story after gallery" },
    });
    await runAutosaveDebounce();

    expect(saveEditorContent).toHaveBeenCalledWith(expect.objectContaining({
      expectedVersion: 11,
    }));
  });

  it("serializes Love Story then Gallery with the latest CAS revision", async () => {
    const saveEditorContent = vi.fn()
      .mockResolvedValueOnce({ success: true, data: { contentVersion: 11 } });
    const replaceEditorGallery = vi.fn()
      .mockResolvedValueOnce({ success: true, data: { contentVersion: 12 } });

    render(
      <EditorWorkspaceProvider initialVersion={10}>
        <StoryGalleryStep
          invitationId={initialData.invitationId}
          initialData={initialData}
          saveEditorContent={saveEditorContent}
          replaceEditorGallery={replaceEditorGallery}
        />
        <RevisionProbe />
      </EditorWorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Tambah Cerita/ }));
    fireEvent.change(screen.getByPlaceholderText("Contoh: Pertama Kali Bertemu"), {
      target: { value: "Story revision 11" },
    });
    fireEvent.click(screen.getByRole("button", { name: "upload-gallery" }));
    await runAutosaveDebounce();

    expect(saveEditorContent).toHaveBeenCalledWith(expect.objectContaining({
      expectedVersion: 10,
    }));
    expect(replaceEditorGallery).toHaveBeenCalledWith(expect.objectContaining({
      expectedVersion: 11,
    }));
    expect(screen.getByLabelText("workspace revision").textContent).toBe("12");
  });
});
