import "server-only";

import crypto from "node:crypto";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import type {
  MediaKind,
  MediaPurpose,
  MediaStatus,
  MediaAsset,
  RequestUploadInput,
  RequestUploadResult,
  UploadCompleteInput,
  MediaServingUrl,
} from "../types";
import {
  QUARANTINE_BUCKET,
  FINAL_BUCKET,
  UPLOAD_EXPIRY_SECONDS,
  SERVING_EXPIRY_SECONDS,
  MAX_FILE_SIZES,
  ALLOWED_MIME_TYPES,
  MEDIA_VARIANTS,
  IMAGE_VARIANT_SIZES,
} from "../types";

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "INVITATION_NOT_FOUND"
      | "QUOTA_EXCEEDED"
      | "INVALID_FILE"
      | "PROCESSING_FAILED"
      | "DATABASE_ERROR"
      | "STORAGE_ERROR",
  ) {
    super(message);
    this.name = "StorageError";
  }
}

function generateStoragePath(
  ownerId: string,
  invitationId: string,
  mediaId: string,
  purpose: MediaPurpose,
  ext: string,
): string {
  return `${ownerId}/${invitationId}/${purpose}/${mediaId}.${ext}`;
}

function getExtensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/webm": "webm",
  };
  return map[mime] ?? "bin";
}

export async function requestUpload(
  userId: string,
  input: RequestUploadInput,
): Promise<RequestUploadResult> {
  const supabase = createSupabaseServiceClient();

  if (input.kind === "video") {
    throw new StorageError("Video upload is not supported in MVP.", "INVALID_FILE");
  }

  if (input.byteSize > MAX_FILE_SIZES[input.kind]) {
    throw new StorageError(
      `File size exceeds maximum of ${MAX_FILE_SIZES[input.kind] / 1024 / 1024}MB.`,
      "INVALID_FILE",
    );
  }

  if (!ALLOWED_MIME_TYPES[input.kind].includes(input.mimeType)) {
    throw new StorageError(
      `MIME type ${input.mimeType} is not allowed for ${input.kind}.`,
      "INVALID_FILE",
    );
  }

  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, user_id")
    .eq("id", input.invitationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!invitation) {
    throw new StorageError("Invitation not found.", "NOT_FOUND");
  }

  const reservationId = crypto.randomUUID();
  const mediaId = crypto.randomUUID();
  const ext = getExtensionFromMime(input.mimeType);
  const quarantinePath = generateStoragePath(userId, input.invitationId, mediaId, input.purpose, ext);

  const { error: reservationError } = await supabase
    .from("upload_reservations")
    .insert({
      id: reservationId,
      invitation_id: input.invitationId,
      owner_id: userId,
      kind: input.kind,
      purpose: input.purpose,
      reserved_count: 1,
      reserved_bytes: input.byteSize,
      status: "active",
      expires_at: new Date(Date.now() + UPLOAD_EXPIRY_SECONDS * 1000).toISOString(),
    });

  if (reservationError) {
    throw new StorageError("Failed to create upload reservation.", "DATABASE_ERROR");
  }

  const { error: mediaError } = await supabase
    .from("media_assets")
    .insert({
      id: mediaId,
      invitation_id: input.invitationId,
      owner_id: userId,
      kind: input.kind,
      purpose: input.purpose,
      status: "pending_upload",
      version: 1,
      original_filename: input.filename,
      declared_mime: input.mimeType,
      byte_size: input.byteSize,
      quarantine_path: quarantinePath,
    });

  if (mediaError) {
    await supabase.from("upload_reservations").delete().eq("id", reservationId);
    throw new StorageError("Failed to create media record.", "DATABASE_ERROR");
  }

  const { data: signedUrl, error: urlError } = await supabase.storage
    .from(QUARANTINE_BUCKET)
    .createSignedUploadUrl(quarantinePath);

  if (urlError) {
    await supabase.from("media_assets").delete().eq("id", mediaId);
    await supabase.from("upload_reservations").delete().eq("id", reservationId);
    throw new StorageError("Failed to generate upload URL.", "STORAGE_ERROR");
  }

  return {
    mediaId,
    uploadUrl: signedUrl.signedUrl,
    quarantinePath,
    expiresAt: Math.floor(Date.now() / 1000) + UPLOAD_EXPIRY_SECONDS,
  };
}

export async function completeUpload(
  userId: string,
  input: UploadCompleteInput,
): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { data: media } = await supabase
    .from("media_assets")
    .select("id, invitation_id, owner_id, kind, purpose, status, quarantine_path")
    .eq("id", input.mediaId)
    .eq("invitation_id", input.invitationId)
    .maybeSingle();

  if (!media) throw new StorageError("Media not found.", "NOT_FOUND");
  if (media.owner_id !== userId) throw new StorageError("Forbidden.", "FORBIDDEN");
  if (media.status !== "pending_upload") {
    throw new StorageError("Media is not in pending_upload status.", "INVALID_FILE");
  }

  const { data: fileMeta } = await supabase.storage
    .from(QUARANTINE_BUCKET)
    .list(`${media.owner_id}/${media.invitation_id}/${media.purpose}`, {
      search: media.id,
    });

  if (!fileMeta || fileMeta.length === 0) {
    throw new StorageError("Uploaded file not found in quarantine.", "STORAGE_ERROR");
  }

  await supabase
    .from("media_assets")
    .update({ status: "uploaded" as MediaStatus })
    .eq("id", input.mediaId);

  await supabase
    .from("upload_reservations")
    .update({ status: "consumed" })
    .eq("invitation_id", input.invitationId)
    .eq("owner_id", userId)
    .eq("kind", media.kind)
    .eq("purpose", media.purpose)
    .eq("status", "active");
}

export async function getMediaAsset(
  mediaId: string,
): Promise<MediaAsset | null> {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", mediaId)
    .maybeSingle();
  return data as MediaAsset | null;
}

export async function getMediaServingUrl(
  mediaId: string,
  variant: string,
): Promise<MediaServingUrl> {
  const supabase = createSupabaseServiceClient();

  const { data: media } = await supabase
    .from("media_assets")
    .select("id, owner_id, invitation_id, purpose, kind, status, final_path")
    .eq("id", mediaId)
    .maybeSingle();

  if (!media) throw new StorageError("Media not found.", "NOT_FOUND");
  if (media.status !== "ready") {
    throw new StorageError("Media is not ready for serving.", "INVALID_FILE");
  }
  if (!media.final_path) {
    throw new StorageError("Media has no final path.", "PROCESSING_FAILED");
  }

  const allowedVariants = MEDIA_VARIANTS[media.kind as MediaKind];
  if (!allowedVariants.includes(variant as never)) {
    throw new StorageError(`Invalid variant '${variant}' for kind '${media.kind}'.`, "INVALID_FILE");
  }

  const filePath = variant === "original"
    ? media.final_path
    : media.final_path.replace(/(\.[^.]+)$/, `_${variant}$1`);

  const { data: urlData, error } = await supabase.storage
    .from(FINAL_BUCKET)
    .createSignedUrl(filePath, SERVING_EXPIRY_SECONDS);

  if (error) {
    throw new StorageError("Failed to generate serving URL.", "STORAGE_ERROR");
  }

  const contentTypeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
    mp3: "audio/mpeg",
    ogg: "audio/ogg",
    wav: "audio/wav",
    webm: "audio/webm",
  };
  const ext = filePath.split(".").pop() ?? "";
  const contentType = contentTypeMap[ext] ?? "application/octet-stream";

  return {
    url: urlData.signedUrl,
    contentType,
    expiresAt: Math.floor(Date.now() / 1000) + SERVING_EXPIRY_SECONDS,
  };
}

export async function deleteMedia(
  userId: string,
  mediaId: string,
): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { data: media } = await supabase
    .from("media_assets")
    .select("id, owner_id, status, final_path, quarantine_path, invitation_id")
    .eq("id", mediaId)
    .maybeSingle();

  if (!media) throw new StorageError("Media not found.", "NOT_FOUND");
  if (media.owner_id !== userId) throw new StorageError("Forbidden.", "FORBIDDEN");

  const { error } = await supabase
    .from("media_assets")
    .update({ status: "deleted" as MediaStatus })
    .eq("id", mediaId);

  if (error) throw new StorageError("Failed to mark media as deleted.", "DATABASE_ERROR");

  const filesToDelete: string[] = [];
  if (media.quarantine_path) filesToDelete.push(media.quarantine_path);
  if (media.final_path) {
    filesToDelete.push(media.final_path);
    for (const variant of ["_thumbnail", "_medium", "_large"]) {
      const dotIndex = media.final_path.lastIndexOf(".");
      if (dotIndex > 0) {
        filesToDelete.push(
          media.final_path.substring(0, dotIndex) + variant + media.final_path.substring(dotIndex),
        );
      }
    }
  }

  if (filesToDelete.length > 0) {
    await supabase.storage.from(FINAL_BUCKET).remove(filesToDelete).catch(() => {});
    await supabase.storage.from(QUARANTINE_BUCKET).remove([media.quarantine_path].filter(Boolean) as string[]).catch(() => {});
  }
}

export async function replaceMedia(
  userId: string,
  oldMediaId: string,
  newMediaId: string,
): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { data: oldMedia } = await supabase
    .from("media_assets")
    .select("id, owner_id, invitation_id, purpose, status")
    .eq("id", oldMediaId)
    .maybeSingle();

  if (!oldMedia) throw new StorageError("Old media not found.", "NOT_FOUND");
  if (oldMedia.owner_id !== userId) throw new StorageError("Forbidden.", "FORBIDDEN");

  const { data: newMedia } = await supabase
    .from("media_assets")
    .select("id, owner_id, invitation_id, purpose, status")
    .eq("id", newMediaId)
    .maybeSingle();

  if (!newMedia) throw new StorageError("New media not found.", "NOT_FOUND");
  if (newMedia.owner_id !== userId) throw new StorageError("Forbidden.", "FORBIDDEN");
  if (newMedia.invitation_id !== oldMedia.invitation_id) {
    throw new StorageError("New media must belong to the same invitation.", "FORBIDDEN");
  }
  if (newMedia.status !== "ready") {
    throw new StorageError("New media must be ready before replacement.", "INVALID_FILE");
  }

  await supabase
    .from("media_assets")
    .update({ status: "deleted" as MediaStatus })
    .eq("id", oldMediaId);
}
