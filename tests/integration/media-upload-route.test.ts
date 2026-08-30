import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/media/upload/route";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  ensureUserProfile: vi.fn(),
  requestUpload: vi.fn(),
  completeUpload: vi.fn(),
  processUploadedMedia: vi.fn(),
}));

vi.mock("@/modules/auth/server/require-user", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/modules/auth/server/ensure-user-profile", () => ({
  ensureUserProfile: mocks.ensureUserProfile,
}));

vi.mock("@/modules/storage/server/actions", () => ({
  StorageError: class StorageError extends Error {},
  requestUpload: mocks.requestUpload,
  completeUpload: mocks.completeUpload,
}));

vi.mock("@/modules/storage/server/processing", () => ({
  processUploadedMedia: mocks.processUploadedMedia,
}));

function completeRequest() {
  return new NextRequest("http://localhost/api/media/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "complete",
      mediaId: "10000000-0000-4000-8000-000000000001",
      invitationId: "20000000-0000-4000-8000-000000000002",
    }),
  });
}

describe("media upload request validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({
      id: "30000000-0000-4000-8000-000000000003",
    });
    mocks.ensureUserProfile.mockResolvedValue(undefined);
    mocks.requestUpload.mockResolvedValue({
      mediaId: "10000000-0000-4000-8000-000000000001",
      uploadUrl: "https://example.test/upload",
    });
  });

  it("rejects invalid kind and purpose combinations", async () => {
    const response = await POST(new NextRequest("http://localhost/api/media/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "request",
        invitationId: "20000000-0000-4000-8000-000000000002",
        kind: "audio",
        purpose: "gallery",
        filename: "test.mp3",
        mimeType: "audio/mpeg",
        byteSize: 123,
        firstBytesBase64: Buffer.from("ID3").toString("base64"),
      }),
    }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Invalid media kind or purpose.",
    });
  });

  it.each([
    {
      kind: "image",
      purpose: "gallery",
      filename: "gallery.jpg",
      mimeType: "image/jpeg",
      firstBytes: Buffer.from([0xff, 0xd8, 0xff]),
    },
    {
      kind: "audio",
      purpose: "background_audio",
      filename: "background.mp3",
      mimeType: "audio/mpeg",
      firstBytes: Buffer.from("ID3"),
    },
  ])("allows $kind + $purpose through mapping validation", async (fixture) => {
    const response = await POST(new NextRequest("http://localhost/api/media/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "request",
        invitationId: "20000000-0000-4000-8000-000000000002",
        kind: fixture.kind,
        purpose: fixture.purpose,
        filename: fixture.filename,
        mimeType: fixture.mimeType,
        byteSize: fixture.firstBytes.length,
        firstBytesBase64: fixture.firstBytes.toString("base64"),
      }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.requestUpload).toHaveBeenCalledWith(
      "30000000-0000-4000-8000-000000000003",
      expect.objectContaining({ kind: fixture.kind, purpose: fixture.purpose }),
    );
  });
});

describe("media upload completion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({
      id: "30000000-0000-4000-8000-000000000003",
    });
    mocks.ensureUserProfile.mockResolvedValue(undefined);
    mocks.completeUpload.mockResolvedValue(undefined);
  });

  it("reports success only after the uploaded media is ready", async () => {
    mocks.processUploadedMedia.mockResolvedValue({
      success: true,
      finalPath: "owner/invitation/gallery/media.webp",
    });

    const response = await POST(completeRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("returns an actionable failure when media processing fails", async () => {
    mocks.processUploadedMedia.mockResolvedValue({
      success: false,
      error: "Failed to move the object from quarantine.",
    });

    const response = await POST(completeRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "File berhasil diunggah, tetapi gagal diproses. Silakan coba unggah kembali.",
    });
  });

  it("rejects a spoofed image before creating an upload reservation", async () => {
    const response = await POST(new NextRequest("http://localhost/api/media/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "request",
        invitationId: "20000000-0000-4000-8000-000000000002",
        kind: "image",
        purpose: "gallery",
        filename: "not-really-an-image.jpg",
        mimeType: "image/jpeg",
        byteSize: 12,
        firstBytesBase64: Buffer.from("plain text").toString("base64"),
      }),
    }));

    expect(response.status).toBe(400);
    expect(mocks.requestUpload).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Isi file tidak cocok dengan format yang dipilih.",
    });
  });
});
