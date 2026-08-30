import { describe, expect, it } from "vitest";
import { probeAudio, canonicalizeAudio } from "@/modules/storage/server/audio-probe";

const cat = (...arrays: Uint8Array[]): Uint8Array => {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
};

const cc = (s: string): Uint8Array =>
  new Uint8Array([...s].map((c) => c.charCodeAt(0)));

const box = (type: string, payload: Uint8Array): Uint8Array => {
  const size = 8 + payload.length;
  const out = new Uint8Array(size);
  new DataView(out.buffer).setUint32(0, size);
  out.set(cc(type), 4);
  out.set(payload, 8);
  return out;
};

const hdlr = (handlerType: string): Uint8Array =>
  box("hdlr", cat(new Uint8Array(8), cc(handlerType)));

const ftyp = (brand: string): Uint8Array => box("ftyp", cc(brand));

const validM4a = (): Uint8Array =>
  cat(
    ftyp("M4A "),
    box("moov", box("trak", box("mdia", hdlr("soun")))),
    box("mdat", new Uint8Array(4)),
  );

const mp4WithVideo = (): Uint8Array =>
  cat(
    ftyp("isom"),
    box(
      "moov",
      cat(
        box("trak", box("mdia", hdlr("vide"))),
        box("trak", box("mdia", hdlr("soun"))),
      ),
    ),
  );

const mp3Id3 = (): Uint8Array =>
  new Uint8Array([0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 0, 0]);
const mp3Sync = (): Uint8Array => new Uint8Array([0xff, 0xfb, 0x90, 0x00]);
const adtsRaw = (): Uint8Array => new Uint8Array([0xff, 0xf1, 0x50, 0x80]);

describe("probeAudio", () => {
  it("accepts valid M4A (audio-only BMFF)", () => {
    expect(probeAudio(validM4a())).toEqual({ status: "audio-only", container: "mp4" });
  });

  it("rejects MP4 containing a video track", () => {
    expect(probeAudio(mp4WithVideo())).toEqual({ status: "rejected", reason: "has-video" });
  });

  it("rejects truncated BMFF without moov (fail-closed)", () => {
    expect(probeAudio(ftyp("M4A "))).toEqual({ status: "rejected", reason: "truncated" });
  });

  it("accepts MP3 with ID3 header", () => {
    expect(probeAudio(mp3Id3())).toEqual({ status: "audio-only", container: "mp3" });
  });

  it("accepts MP3 with sync word", () => {
    expect(probeAudio(mp3Sync())).toEqual({ status: "audio-only", container: "mp3" });
  });

  it("rejects raw ADTS AAC (must use M4A container)", () => {
    expect(probeAudio(adtsRaw())).toEqual({ status: "rejected", reason: "adts-use-m4a" });
  });

  it("rejects garbage bytes", () => {
    expect(probeAudio(new Uint8Array([0x00, 0x01, 0x02]))).toEqual({
      status: "rejected",
      reason: "unknown",
    });
  });
});

describe("canonicalizeAudio", () => {
  it("bytes M4A (whatever the filename) -> m4a / audio/mp4", () => {
    expect(canonicalizeAudio(validM4a())).toEqual({ mime: "audio/mp4", ext: "m4a" });
  });

  it("bytes MP3 (whatever the filename) -> mp3 / audio/mpeg", () => {
    expect(canonicalizeAudio(mp3Id3())).toEqual({ mime: "audio/mpeg", ext: "mp3" });
  });

  it("returns null for MP4 with video", () => {
    expect(canonicalizeAudio(mp4WithVideo())).toBeNull();
  });

  it("returns null for garbage", () => {
    expect(canonicalizeAudio(new Uint8Array([0xde, 0xad]))).toBeNull();
  });
