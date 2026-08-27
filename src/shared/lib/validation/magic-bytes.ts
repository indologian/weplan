export type MagicByteSignature = {
  mime: string;
  kind: "image" | "audio";
  offsets: number[];
  bytes: number[];
};

const MAGIC_SIGNATURES: MagicByteSignature[] = [
  { mime: "image/jpeg", kind: "image", offsets: [0, 1, 2], bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", kind: "image", offsets: [0, 1, 2, 3], bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", kind: "image", offsets: [0, 1, 2, 3, 8, 9, 10, 11], bytes: [0x52, 0x49, 0x46, 0x46, 0x57, 0x45, 0x42, 0x50] },
  { mime: "image/avif", kind: "image", offsets: [0, 1, 2, 3, 4, 5, 6, 7], bytes: [0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70] },
  { mime: "audio/mpeg", kind: "audio", offsets: [0, 1], bytes: [0xff, 0xfb] },
  { mime: "audio/mpeg", kind: "audio", offsets: [0, 1, 2], bytes: [0x49, 0x44, 0x33] },
  { mime: "audio/ogg", kind: "audio", offsets: [0, 1, 2, 3], bytes: [0x4f, 0x67, 0x67, 0x53] },
  { mime: "audio/wav", kind: "audio", offsets: [0, 1, 2, 3], bytes: [0x52, 0x49, 0x46, 0x46] },
  { mime: "audio/webm", kind: "audio", offsets: [0, 1, 2, 3], bytes: [0x1a, 0x45, 0xdf, 0xa3] },
];

export function detectMimeFromBytes(firstBytes: Uint8Array): string | null {
  for (const sig of MAGIC_SIGNATURES) {
    let matches = true;
    for (let i = 0; i < sig.offsets.length; i++) {
      if (firstBytes[sig.offsets[i]!] !== sig.bytes[i]!) {
        matches = false;
        break;
      }
    }
    if (matches) return sig.mime;
  }
  return null;
}

export function validateMagicBytes(
  firstBytes: Uint8Array,
  declaredMime: string,
  kind: "image" | "audio",
): { valid: boolean; detectedMime: string | null; error?: string } {
  const detectedMime = detectMimeFromBytes(firstBytes);

  if (!detectedMime) {
    return { valid: false, detectedMime: null, error: "Unable to detect file type from magic bytes." };
  }

  const detectedSig = MAGIC_SIGNATURES.find((s) => s.mime === detectedMime);
  if (!detectedSig || detectedSig.kind !== kind) {
    return {
      valid: false,
      detectedMime,
      error: `Detected file type '${detectedMime}' does not match expected kind '${kind}'.`,
    };
  }

  if (declaredMime !== detectedMime) {
    return {
      valid: false,
      detectedMime,
      error: `Declared MIME '${declaredMime}' does not match detected '${detectedMime}'.`,
    };
  }

  return { valid: true, detectedMime };
}
