import "server-only";

export function detectImageFormat(buffer: Uint8Array): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "jpg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "png";
  
  const chars = Array.from(buffer.subarray(8, 12)).map(c => String.fromCharCode(c)).join('');
  if (chars === "WEBP") return "webp";
  
  const charsFtyp = Array.from(buffer.subarray(4, 8)).map(c => String.fromCharCode(c)).join('');
  const charsAvif = Array.from(buffer.subarray(8, 12)).map(c => String.fromCharCode(c)).join('');
  if (charsFtyp === "ftyp" && charsAvif === "avif") return "avif";
  
  return null;
}
