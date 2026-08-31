import {
  MAX_FILE_SIZE_AUDIO,
  MAX_FILE_SIZE_IMAGE,
} from "@/config/constants";

export type MediaKind = "image" | "audio" | "video";

export type MediaPurpose =
  | "couple_portrait"
  | "story_image"
  | "gallery"
  | "background_audio"
  | "qris_image"
  | "future_uploaded_video";

export type MediaStatus =
  | "pending_upload"
  | "uploaded"
  | "processing"
  | "ready"
  | "rejected"
  | "deleting"
  | "deleted";

export type MediaVariant = "original" | "thumbnail" | "medium" | "large";

export const MEDIA_VARIANTS: Record<MediaKind, MediaVariant[]> = {
  image: ["original", "thumbnail", "medium", "large"],
  audio: ["original"],
  video: ["original"],
};

export const MAX_FILE_SIZES: Record<MediaKind, number> = {
  image: MAX_FILE_SIZE_IMAGE,
  audio: MAX_FILE_SIZE_AUDIO,
  video: 0, // disabled for MVP
};

export const ALLOWED_MIME_TYPES: Record<MediaKind, readonly string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  audio: ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/ogg", "audio/wav", "audio/webm"],
  video: [],
};

export const IMAGE_VARIANT_SIZES = {
  thumbnail: { width: 150, height: 150 },
  medium: { width: 600, height: 600 },
  large: { width: 1920, height: 1920 },
} as const;

export const QUARANTINE_BUCKET = "invitation_upload_quarantine";
export const FINAL_BUCKET = "invitation_media";

export const UPLOAD_EXPIRY_SECONDS = 15 * 60; // 15 minutes
export const SERVING_EXPIRY_SECONDS = 15 * 60; // 15 minutes signed URL

export type UploadReservation = {
  id: string;
  invitationId: string;
  ownerId: string;
  kind: MediaKind;
  purpose: MediaPurpose;
  reservedCount: number;
  reservedBytes: number;
  status: "active" | "consumed" | "released" | "expired";
  expiresAt: string;
};

export type MediaAsset = {
  id: string;
  invitationId: string;
  ownerId: string;
  kind: MediaKind;
  purpose: MediaPurpose;
  status: MediaStatus;
  version: number;
  originalFilename: string | null;
  declaredMime: string | null;
  detectedMime: string | null;
  quarantinePath: string | null;
  finalPath: string | null;
  posterPath: string | null;
  byteSize: number | null;
  width: number | null;
  height: number | null;
  focusX: number;
  focusY: number;
  durationSeconds: number | null;
  processingStartedAt: string | null;
  failureCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RequestUploadInput = {
  invitationId: string;
  kind: MediaKind;
  purpose: MediaPurpose;
  filename: string;
  mimeType: string;
  declaredMimeType?: string;
  byteSize: number;
};

export type RequestUploadResult = {
  mediaId: string;
  uploadUrl: string;
  uploadMimeType: string;
  quarantinePath: string;
  expiresAt: number;
};

export type UploadCompleteInput = {
  mediaId: string;
  invitationId: string;
};

export type MediaServingUrl = {
  url: string;
  contentType: string;
  expiresAt: number;
};
