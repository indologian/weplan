const ISO_BMFF_BRANDS = new Set([
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

type Mp4Box = {
  type: string;
  payloadStart: number;
  end: number;
};

export type Mp4AudioValidationResult =
  | {
      valid: true;
      mimeType: "audio/mp4";
      extension: "m4a";
      durationSeconds?: number;
    }
  | {
      valid: false;
      failureCode:
        | "INVALID_MP4_CONTAINER"
        | "AUDIO_TRACK_MISSING"
        | "VIDEO_TRACK_NOT_ALLOWED"
        | "UNSUPPORTED_AUDIO_CODEC"
        | "AUDIO_DURATION_EXCEEDED";
    };

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function readUint32(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset + 4 > bytes.length) return null;
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);
}

function readUint64(bytes: Uint8Array, offset: number): number | null {
  const high = readUint32(bytes, offset);
  const low = readUint32(bytes, offset + 4);
  if (high === null || low === null) return null;

  const value = high * 2 ** 32 + low;
  return Number.isSafeInteger(value) ? value : null;
}

function readBoxes(bytes: Uint8Array, start: number, end: number): Mp4Box[] | null {
  const boxes: Mp4Box[] = [];
  let offset = start;

  while (offset < end) {
    if (offset + 8 > end) return null;

    const shortSize = readUint32(bytes, offset);
    if (shortSize === null) return null;

    let headerSize = 8;
    let boxSize = shortSize;
    if (shortSize === 1) {
      const extendedSize = readUint64(bytes, offset + 8);
      if (extendedSize === null) return null;
      headerSize = 16;
      boxSize = extendedSize;
    } else if (shortSize === 0) {
      boxSize = end - offset;
    }

    if (boxSize < headerSize || offset + boxSize > end) return null;

    boxes.push({
      type: readAscii(bytes, offset + 4, 4),
      payloadStart: offset + headerSize,
      end: offset + boxSize,
    });
    offset += boxSize;
  }

  return offset === end ? boxes : null;
}

function findChild(bytes: Uint8Array, parent: Mp4Box, type: string): Mp4Box | null {
  return readBoxes(bytes, parent.payloadStart, parent.end)?.find((box) => box.type === type) ?? null;
}

function hasSupportedBrand(bytes: Uint8Array, ftyp: Mp4Box): boolean {
  if (ftyp.payloadStart + 8 > ftyp.end) return false;

  if (ISO_BMFF_BRANDS.has(readAscii(bytes, ftyp.payloadStart, 4))) return true;
  for (let offset = ftyp.payloadStart + 8; offset + 4 <= ftyp.end; offset += 4) {
    if (ISO_BMFF_BRANDS.has(readAscii(bytes, offset, 4))) return true;
  }
  return false;
}

function readHandlerType(bytes: Uint8Array, mdia: Mp4Box): string | null {
  const hdlr = findChild(bytes, mdia, "hdlr");
  if (!hdlr || hdlr.payloadStart + 12 > hdlr.end) return null;
  return readAscii(bytes, hdlr.payloadStart + 8, 4);
}

function readDurationSeconds(bytes: Uint8Array, mdia: Mp4Box): number | undefined {
  const mdhd = findChild(bytes, mdia, "mdhd");
  if (!mdhd || mdhd.payloadStart + 4 > mdhd.end) return undefined;

  const version = bytes[mdhd.payloadStart];
  const timescaleOffset = version === 1 ? mdhd.payloadStart + 20 : mdhd.payloadStart + 12;
  const durationOffset = version === 1 ? mdhd.payloadStart + 24 : mdhd.payloadStart + 16;
  const timescale = readUint32(bytes, timescaleOffset);
  const duration = version === 1
    ? readUint64(bytes, durationOffset)
    : readUint32(bytes, durationOffset);

  if (!timescale || duration === null) return undefined;
  const seconds = duration / timescale;
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

function hasAacSampleEntry(bytes: Uint8Array, mdia: Mp4Box): boolean {
  const minf = findChild(bytes, mdia, "minf");
  const stbl = minf ? findChild(bytes, minf, "stbl") : null;
  const stsd = stbl ? findChild(bytes, stbl, "stsd") : null;
  if (!stsd || stsd.payloadStart + 8 > stsd.end) return false;

  const entryCount = readUint32(bytes, stsd.payloadStart + 4);
  const entries = readBoxes(bytes, stsd.payloadStart + 8, stsd.end);
  if (entryCount === null || !entries || entries.length !== entryCount) return false;
  return entries.some((entry) => entry.type === "mp4a");
}

export function validateMp4Audio(
  bytes: Uint8Array,
  maxDurationSeconds = 36_000,
): Mp4AudioValidationResult {
  const topLevel = readBoxes(bytes, 0, bytes.length);
  if (!topLevel) return { valid: false, failureCode: "INVALID_MP4_CONTAINER" };

  const ftyp = topLevel.find((box) => box.type === "ftyp");
  const moov = topLevel.find((box) => box.type === "moov");
  if (!ftyp || !moov || !hasSupportedBrand(bytes, ftyp)) {
    return { valid: false, failureCode: "INVALID_MP4_CONTAINER" };
  }

  const moovChildren = readBoxes(bytes, moov.payloadStart, moov.end);
  if (!moovChildren) return { valid: false, failureCode: "INVALID_MP4_CONTAINER" };

  let audioTrackFound = false;
  let aacTrackFound = false;
  let durationSeconds: number | undefined;

  for (const track of moovChildren.filter((box) => box.type === "trak")) {
    const mdia = findChild(bytes, track, "mdia");
    if (!mdia) continue;

    const handlerType = readHandlerType(bytes, mdia);
    if (handlerType === "vide") {
      return { valid: false, failureCode: "VIDEO_TRACK_NOT_ALLOWED" };
    }
    if (handlerType !== "soun") continue;

    audioTrackFound = true;
    aacTrackFound ||= hasAacSampleEntry(bytes, mdia);
    const trackDuration = readDurationSeconds(bytes, mdia);
    if (trackDuration !== undefined) {
      durationSeconds = Math.max(durationSeconds ?? 0, trackDuration);
    }
  }

  if (!audioTrackFound) return { valid: false, failureCode: "AUDIO_TRACK_MISSING" };
  if (!aacTrackFound) return { valid: false, failureCode: "UNSUPPORTED_AUDIO_CODEC" };
  if (durationSeconds !== undefined && durationSeconds > maxDurationSeconds) {
    return { valid: false, failureCode: "AUDIO_DURATION_EXCEEDED" };
  }

  return {
    valid: true,
    mimeType: "audio/mp4",
    extension: "m4a",
    ...(durationSeconds === undefined ? {} : { durationSeconds }),
  };
}
