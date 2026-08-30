import "server-only";

export type AudioProbeResult =
  | { status: "audio-only"; container: "mp4" | "mp3" }
  | { status: "rejected"; reason: "has-video" | "not-audio" | "truncated" | "adts-use-m4a" | "unknown" };

const fourcc = (b: Uint8Array, o: number): string =>
  String.fromCharCode(b[o]!, b[o + 1]!, b[o + 2]!, b[o + 3]!);

function* boxes(b: Uint8Array, start: number, end: number) {
  let off = start;
  while (off + 8 <= end) {
    const v = new DataView(b.buffer, b.byteOffset + off, end - off);
    let size = v.getUint32(0);
    const head = size === 1 ? 16 : 8;
    if (size === 1) {
      if (off + 16 > end) return;
      size = Number(v.getBigUint64(8));
    } else if (size === 0) {
      size = end - off;
    }
    if (size < head || off + size > end) return;
    yield { type: fourcc(b, off + 4), from: off + head, to: off + size };
    off += size;
  }
}

const isAdts = (b: Uint8Array): boolean =>
  b.length >= 2 && b[0] === 0xff && (b[1]! & 0xf0) === 0xf0 && (b[1]! & 0x06) === 0x00;

const isMp3 = (b: Uint8Array): boolean =>
  b.length >= 3 &&
  ((b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) ||
   (b[0] === 0xff && (b[1]! & 0xe0) === 0xe0 && (b[1]! & 0x06) !== 0x00));

export function probeAudio(b: Uint8Array): AudioProbeResult {
  if (b.length >= 3 && isMp3(b)) return { status: "audio-only", container: "mp3" };
  if (isAdts(b)) return { status: "rejected", reason: "adts-use-m4a" };
  if (b.length < 16 || fourcc(b, 4) !== "ftyp") return { status: "rejected", reason: "unknown" };

  let sawMoov = false;
  let soun = 0;
  let vide = 0;

  for (const top of boxes(b, 0, b.length)) {
    if (top.type !== "moov") continue;
    sawMoov = true;
    for (const trak of boxes(b, top.from, top.to)) {
      if (trak.type !== "trak") continue;
      for (const mdia of boxes(b, trak.from, trak.to)) {
        if (mdia.type !== "mdia") continue;
        for (const hdlr of boxes(b, mdia.from, mdia.to)) {
          if (hdlr.type !== "hdlr" || hdlr.to - hdlr.from < 12) continue;
          const h = fourcc(b, hdlr.from + 8);
          if (h === "soun") soun++;
          else if (h === "vide") vide++;
        }
      }
    }
  }

  if (!sawMoov) return { status: "rejected", reason: "truncated" };
  if (vide > 0) return { status: "rejected", reason: "has-video" };
  if (soun === 0) return { status: "rejected", reason: "not-audio" };
  return { status: "audio-only", container: "mp4" };
}

/**
 * Canonicalize audio format based on BYTES, not filename.
 * Returns null if the file is not a valid audio-only file.
 */
export function canonicalizeAudio(
  b: Uint8Array,
): { mime: string; ext: string } | null {
  const r = probeAudio(b);
  if (r.status !== "audio-only") return null;
  return r.container === "mp3"
    ? { mime: "audio/mpeg", ext: "mp3" }
    : { mime: "audio/mp4", ext: "m4a" };
}
