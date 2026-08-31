import { describe, expect, it } from "vitest";
import { detectMimeFromBytes, validateMagicBytes } from "@/shared/lib/validation/magic-bytes";

describe("magic-bytes", () => {
  describe("detectMimeFromBytes", () => {
    it("detects JPEG", () => {
      const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(detectMimeFromBytes(bytes)).toBe("image/jpeg");
    });

    it("detects PNG", () => {
      const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(detectMimeFromBytes(bytes)).toBe("image/png");
    });

    it("detects WebP", () => {
      const bytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
      expect(detectMimeFromBytes(bytes)).toBe("image/webp");
    });

    it("detects OGG audio", () => {
      const bytes = new Uint8Array([0x4f, 0x67, 0x67, 0x53, 0x00, 0x02, 0x00, 0x00]);
      expect(detectMimeFromBytes(bytes)).toBe("audio/ogg");
    });

    it("detects MP3 (ID3 header)", () => {
      const bytes = new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00]);
      expect(detectMimeFromBytes(bytes)).toBe("audio/mpeg");
    });

    it("detects a DASH-branded M4A container as audio/mp4", () => {
      const bytes = new Uint8Array([
        0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
        0x64, 0x61, 0x73, 0x68, 0x00, 0x00, 0x00, 0x00,
        0x69, 0x73, 0x6f, 0x36, 0x6d, 0x70, 0x34, 0x31,
      ]);
      expect(detectMimeFromBytes(bytes)).toBe("audio/mp4");
    });

    it("detects AVIF by its brand instead of any ftyp box", () => {
      const bytes = new Uint8Array([
        0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
        0x61, 0x76, 0x69, 0x66, 0x00, 0x00, 0x00, 0x00,
        0x6d, 0x69, 0x66, 0x31, 0x61, 0x76, 0x69, 0x66,
      ]);
      expect(detectMimeFromBytes(bytes)).toBe("image/avif");
    });

    it("returns null for unknown bytes", () => {
      const bytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      expect(detectMimeFromBytes(bytes)).toBeNull();
    });
  });

  describe("validateMagicBytes", () => {
    it("validates matching JPEG", () => {
      const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const result = validateMagicBytes(bytes, "image/jpeg", "image");
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe("image/jpeg");
    });

    it("rejects mismatched declared MIME", () => {
      const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const result = validateMagicBytes(bytes, "image/png", "image");
      expect(result.valid).toBe(false);
      expect(result.detectedMime).toBe("image/jpeg");
      expect(result.error).toContain("does not match detected");
    });

    it("canonicalizes a renamed AAC M4A only when explicitly enabled", () => {
      const bytes = new Uint8Array([
        0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
        0x64, 0x61, 0x73, 0x68, 0x00, 0x00, 0x00, 0x00,
        0x69, 0x73, 0x6f, 0x36, 0x6d, 0x70, 0x34, 0x31,
      ]);

      expect(validateMagicBytes(bytes, "audio/mpeg", "audio").valid).toBe(false);
      expect(validateMagicBytes(bytes, "audio/mpeg", "audio", {
        allowAudioMp4Canonicalization: true,
      })).toEqual({ valid: true, detectedMime: "audio/mp4" });
    });

    it("rejects wrong kind", () => {
      const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const result = validateMagicBytes(bytes, "image/jpeg", "audio");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("does not match expected kind");
    });

    it("rejects unknown bytes", () => {
      const bytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const result = validateMagicBytes(bytes, "image/jpeg", "image");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unable to detect");
    });
  });
});
