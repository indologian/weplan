import "server-only";

import sharp from "sharp";
import { IMAGE_VARIANT_SIZES } from "../types";

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
  const metadata = await sharp(inputBuffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  const original = await sharp(inputBuffer)
    .rotate() // auto-rotate based on EXIF, then strip all metadata
    .toBuffer();

  const thumbnail = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: IMAGE_VARIANT_SIZES.thumbnail.width,
      height: IMAGE_VARIANT_SIZES.thumbnail.height,
      fit: "cover",
      withoutEnlargement: true,
    })
    .toBuffer();

  const medium = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: IMAGE_VARIANT_SIZES.medium.width,
      height: IMAGE_VARIANT_SIZES.medium.height,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toBuffer();

  const large = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: IMAGE_VARIANT_SIZES.large.width,
      height: IMAGE_VARIANT_SIZES.large.height,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toBuffer();

  return { original, thumbnail, medium, large, width, height };
}

export function detectImageFormat(buffer: Buffer): string | null {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "png";
  if (buffer.subarray(8, 12).toString() === "WEBP") return "webp";
  if (buffer.subarray(4, 8).toString() === "ftyp" && buffer.subarray(8, 12).toString() === "avif") return "avif";
  return null;
}
