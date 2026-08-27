import "server-only";

import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { QUARANTINE_BUCKET, FINAL_BUCKET, IMAGE_VARIANT_SIZES } from "../types";
import { processImage, detectImageFormat } from "./image-processor";

type ProcessResult = {
  success: boolean;
  finalPath?: string;
  width?: number;
  height?: number;
  error?: string;
};

const PROCESSING_LOCK_TTL_SECONDS = 300; // 5 minutes

export async function processUploadedMedia(mediaId: string): Promise<ProcessResult> {
  const supabase = createSupabaseServiceClient();

  const { data: media } = await supabase
    .from("media_assets")
    .select("id, invitation_id, owner_id, kind, purpose, status, quarantine_path, original_filename")
    .eq("id", mediaId)
    .maybeSingle();

  if (!media) return { success: false, error: "Media not found." };
  if (media.status !== "uploaded") return { success: false, error: `Media status is '${media.status}', expected 'uploaded'.` };
  if (!media.quarantine_path) return { success: false, error: "No quarantine path." };

  const lockKey = `processing_lock:${mediaId}`;
  const { data: lockResult } = await supabase.rpc("pg_try_advisory_lock", { lock_id: hashStringToBigInt(lockKey) }).maybeSingle();

  if (lockResult === false) {
    return { success: false, error: "Media is already being processed." };
  }

  try {
    await supabase
      .from("media_assets")
      .update({ status: "processing", processing_started_at: new Date().toISOString() })
      .eq("id", mediaId)
      .eq("status", "uploaded");

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(QUARANTINE_BUCKET)
      .download(media.quarantine_path);

    if (downloadError || !fileData) {
      await supabase
        .from("media_assets")
        .update({ status: "rejected", failure_code: "DOWNLOAD_FAILED" })
        .eq("id", mediaId);
      return { success: false, error: "Failed to download from quarantine." };
    }

    const inputBuffer = Buffer.from(await fileData.arrayBuffer());

    if (media.kind === "image") {
      const ext = detectImageFormat(inputBuffer) ?? "jpg";
      const contentType = `image/${ext === "jpg" ? "jpeg" : ext}`;
      const basePath = `${media.owner_id}/${media.invitation_id}/${media.purpose}/${mediaId}`;
      const finalPath = `${basePath}.${ext}`;

      const processed = await processImage(inputBuffer);

      const uploads = [
        { path: finalPath, buffer: processed.original, label: "original" },
        { path: `${basePath}_thumbnail.${ext}`, buffer: processed.thumbnail, label: "thumbnail" },
        { path: `${basePath}_medium.${ext}`, buffer: processed.medium, label: "medium" },
        { path: `${basePath}_large.${ext}`, buffer: processed.large, label: "large" },
      ];

      for (const upload of uploads) {
        const { error: uploadError } = await supabase.storage
          .from(FINAL_BUCKET)
          .upload(upload.path, upload.buffer, {
            contentType,
            upsert: true,
          });

        if (uploadError) {
          await supabase
            .from("media_assets")
            .update({ status: "rejected", failure_code: `UPLOAD_${upload.label.toUpperCase()}_FAILED` })
            .eq("id", mediaId);
          return { success: false, error: `Failed to upload ${upload.label} variant.` };
        }
      }

      await supabase
        .from("media_assets")
        .update({
          status: "ready",
          final_path: finalPath,
          detected_mime: contentType,
          width: processed.width,
          height: processed.height,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mediaId);

      await supabase.storage.from(QUARANTINE_BUCKET).remove([media.quarantine_path]).catch(() => {});

      return { success: true, finalPath, width: processed.width, height: processed.height };
    }

    const ext = media.original_filename?.split(".").pop() ?? "bin";
    const finalPath = `${media.owner_id}/${media.invitation_id}/${media.purpose}/${mediaId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(FINAL_BUCKET)
      .upload(finalPath, inputBuffer, { upsert: true });

    if (uploadError) {
      await supabase
        .from("media_assets")
        .update({ status: "rejected", failure_code: "UPLOAD_FINAL_FAILED" })
        .eq("id", mediaId);
      return { success: false, error: "Failed to upload final media." };
    }

    await supabase
      .from("media_assets")
      .update({
        status: "ready",
        final_path: finalPath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mediaId);

    await supabase.storage.from(QUARANTINE_BUCKET).remove([media.quarantine_path]).catch(() => {});

    return { success: true, finalPath };
  } catch (error) {
    await supabase
      .from("media_assets")
      .update({ status: "rejected", failure_code: "PROCESSING_ERROR" })
      .eq("id", mediaId);
    return { success: false, error: error instanceof Error ? error.message : "Processing failed." };
  }
}

function hashStringToBigInt(str: string): bigint {
  let hash = 0n;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5n) - hash + BigInt(str.charCodeAt(i))) & 0x7fffffffffffffffn;
  }
  return hash || 1n;
}
