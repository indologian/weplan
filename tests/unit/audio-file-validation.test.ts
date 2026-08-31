import { describe, expect, it } from "vitest";
import { validateMp4Audio } from "@/modules/storage/audio-file-validation";

function ascii(value: string): Uint8Array {
  return Uint8Array.from(value, (character) => character.charCodeAt(0));
}

function uint32(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value);
  return bytes;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function box(type: string, ...payload: Uint8Array[]): Uint8Array {
  const content = concat(...payload);
  return concat(uint32(content.length + 8), ascii(type), content);
}

function mediaTrack(handlerType: string, codec: string, durationSeconds = 10): Uint8Array {
  const mdhdPayload = new Uint8Array(24);
  const mdhdView = new DataView(mdhdPayload.buffer);
  mdhdView.setUint32(12, 44_100);
  mdhdView.setUint32(16, 44_100 * durationSeconds);

  const hdlrPayload = concat(new Uint8Array(8), ascii(handlerType));
  const stsdPayload = concat(new Uint8Array(4), uint32(1), box(codec));
  return box(
    "trak",
    box(
      "mdia",
      box("mdhd", mdhdPayload),
      box("hdlr", hdlrPayload),
      box("minf", box("stbl", box("stsd", stsdPayload))),
    ),
  );
}

function mp4(...tracks: Uint8Array[]): Uint8Array {
  return concat(
    box("ftyp", ascii("dash"), uint32(0), ascii("iso6"), ascii("mp41")),
    box("moov", ...tracks),
  );
}

describe("validateMp4Audio", () => {
  it("accepts an audio-only AAC M4A and reads its duration", () => {
    expect(validateMp4Audio(mp4(mediaTrack("soun", "mp4a", 10)))).toEqual({
      valid: true,
      mimeType: "audio/mp4",
      extension: "m4a",
      durationSeconds: 10,
    });
  });

  it("rejects a container that has a video track", () => {
    expect(validateMp4Audio(mp4(
      mediaTrack("soun", "mp4a"),
      mediaTrack("vide", "avc1"),
    ))).toEqual({ valid: false, failureCode: "VIDEO_TRACK_NOT_ALLOWED" });
  });

  it("rejects a container without an audio track", () => {
    expect(validateMp4Audio(mp4(mediaTrack("meta", "mett")))).toEqual({
      valid: false,
      failureCode: "AUDIO_TRACK_MISSING",
    });
  });

  it("rejects an unsupported audio codec", () => {
    expect(validateMp4Audio(mp4(mediaTrack("soun", "alac")))).toEqual({
      valid: false,
      failureCode: "UNSUPPORTED_AUDIO_CODEC",
    });
  });

  it("rejects audio beyond the absolute duration limit", () => {
    expect(validateMp4Audio(mp4(mediaTrack("soun", "mp4a", 11)), 10)).toEqual({
      valid: false,
      failureCode: "AUDIO_DURATION_EXCEEDED",
    });
  });
});
