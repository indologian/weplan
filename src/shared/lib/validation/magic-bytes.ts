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
  { mime: "audio/mpeg", kind: "audio", offsets: [0, 1], bytes: [0xff, 0xfb] },
  { mime: "audio/mpeg", kind: "audio", offsets: [0, 1], bytes: [0xff, 0xf3] },
  { mime: "audio/mpeg", kind: "audio", offsets: [0, 1], bytes: [0xff, 0xfa] },
  { mime: "audio/mpeg", kind: "audio", offsets: [0, 1, 2], bytes: [0x49, 0x44, 0x33] },
  { mime: "audio/ogg", kind: "audio", offsets: [0, 1, 2, 3], bytes: [0x4f, 0x67, 0x67, 0x53] },
  { mime: "audio/wav", kind: "audio", offsets: [0, 1, 2, 3], bytes: [0x52, 0x49, 0x46, 0x46] },
  { mime: "audio/webm", kind: "audio", offsets: [0, 1, 2, 3], bytes: [0x1a, 0x45, 0xdf, 0xa3] },
];

const AVIF_BRANDS = new Set(["avif", "avis"]);
const AUDIO_MP4_BRANDS = new Set([
  "M4A ",
  "M4B ",
  "dash",
  "isom",
  "iso2",
  "iso3",
  "iso4",
  "iso5",
  "iso6",
  "mp41",
  "mp42",
]);

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function getIsoBmffBrands(firstBytes: Uint8Array): string[] | null {
  if (firstBytes.length < 16 || readAscii(firstBytes, 4, 4) !== "ftyp") return null;

  const declaredSize = new DataView(
    firstBytes.buffer,
    firstBytes.byteOffset,
    4,
  ).getUint32(0);
  const boxEnd = Math.min(declaredSize, firstBytes.length);
  if (declaredSize < 16 || boxEnd < 16) return null;

  const brands = [readAscii(firstBytes, 8, 4)];
  for (let offset = 16; offset + 4 <= boxEnd; offset += 4) {
    brands.push(readAscii(firstBytes, offset, 4));
  }
  return brands;
}

export function detectMimeFromBytes(firstBytes: Uint8Array): string | null {
  const isoBmffBrands = getIsoBmffBrands(firstBytes);
  if (isoBmffBrands?.some((brand) => AVIF_BRANDS.has(brand))) return "image/avif";
  if (isoBmffBrands?.some((brand) => AUDIO_MP4_BRANDS.has(brand))) return "audio/mp4";

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
  options?: { allowAudioMp4Canonicalization?: boolean },
): { valid: boolean; detectedMime: string | null; error?: string } {
  const detectedMime = detectMimeFromBytes(firstBytes);

  if (!detectedMime) {
    return { valid: false, detectedMime: null, error: "Unable to detect file type from magic bytes." };
  }

  const detectedKind = detectedMime.startsWith("image/") ? "image" : "audio";
  if (detectedKind !== kind) {
    return {
      valid: false,
      detectedMime,
      error: `Detected file type '${ detectedMime }' does not match expected kind '${ kind }'.`,
    };
  }

  const normalizedDeclaredMime = declaredMime.toLowerCase();
  const mayCanonicalizeAudioMp4 =
    options?.allowAudioMp4Canonicalization === true &&
    detectedMime === "audio/mp4" &&
    ["audio/mp4", "audio/x-m4a", "audio/mpeg", "audio/aac"].includes(normalizedDeclaredMime);

  if (normalizedDeclaredMime !== detectedMime && !mayCanonicalizeAudioMp4) {
    return {
      valid: false,
      detectedMime,
      error: `Declared MIME '${ declaredMime }' does not match detected '${ detectedMime }'.`,
    };
  }

  return { valid: true, detectedMime };
}
