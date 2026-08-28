import "server-only";

// Cloudflare Workers do not support sharp.
// For the MVP, we bypass image resizing and just return the original buffer.
type ProcessImageResult = {
  original: Buffer;
  thumbnail: Buffer;
  medium: Buffer;
  large: Buffer;
  width: number;
  height: number;
};

export async function processImage(
  inputBuffer: Buffer,
): Promise<ProcessImageResult> {
  return {
    original: inputBuffer,
    thumbnail: inputBuffer,
    medium: inputBuffer,
    large: inputBuffer,
    width: 0,
    height: 0,
  };
}

export function detectImageFormat(buffer: Buffer): string | null {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "png";
  if (buffer.subarray(8, 12).toString() === "WEBP") return "webp";
  if (buffer.subarray(4, 8).toString() === "ftyp" && buffer.subarray(8, 12).toString() === "avif") return "avif";
  return null;
}
