import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/lib/supabase/service-client", () => ({
  createSupabaseServiceClient: () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    storage: {
      from: vi.fn().mockReturnValue({
        createSignedUploadUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.com/upload" }, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.com/serving" }, error: null }),
        list: vi.fn().mockResolvedValue({ data: [{ name: "test.jpg" }], error: null }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  }),
}));

vi.mock("server-only", () => ({}));

import { StorageError } from "@/modules/storage/server/actions";

describe("StorageError", () => {
  it("has correct name and code", () => {
    const error = new StorageError("test", "NOT_FOUND");
    expect(error.name).toBe("StorageError");
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("test");
  });

  it("is instance of Error", () => {
    const error = new StorageError("test", "FORBIDDEN");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(StorageError);
  });
});

describe("media types", () => {
  it("defines correct max file sizes", async () => {
    const { MAX_FILE_SIZES } = await import("@/modules/storage/types");
    expect(MAX_FILE_SIZES.image).toBe(10 * 1024 * 1024);
    expect(MAX_FILE_SIZES.audio).toBe(5 * 1024 * 1024);
    expect(MAX_FILE_SIZES.video).toBe(0);
  });

  it("defines correct allowed MIME types", async () => {
    const { ALLOWED_MIME_TYPES } = await import("@/modules/storage/types");
    expect(ALLOWED_MIME_TYPES.image).toContain("image/jpeg");
    expect(ALLOWED_MIME_TYPES.image).toContain("image/webp");
    expect(ALLOWED_MIME_TYPES.audio).toContain("audio/mpeg");
    expect(ALLOWED_MIME_TYPES.video).toHaveLength(0);
  });

  it("defines correct variant sizes", async () => {
    const { IMAGE_VARIANT_SIZES } = await import("@/modules/storage/types");
    expect(IMAGE_VARIANT_SIZES.thumbnail.width).toBe(150);
    expect(IMAGE_VARIANT_SIZES.medium.width).toBe(600);
    expect(IMAGE_VARIANT_SIZES.large.width).toBe(1200);
  });
});
