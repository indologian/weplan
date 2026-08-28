import "server-only";

import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { QUARANTINE_BUCKET, FINAL_BUCKET } from "../types";
import { detectImageFormat } from "./image-processor";

type ProcessResult = {
  success: boolean;
  finalPath?: string;
  width?: number;
  height?: number;
  error?: string;
};

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

    if (media.kind === "image") {
      // Use standard Web API to get bytes to avoid Node Buffer issues on Cloudflare Edge
      const arrayBuffer = await fileData.arrayBuffer();
      const firstBytes = new Uint8Array(arrayBuffer.slice(0, 16));
      
      const ext = detectImageFormat(firstBytes) ?? "jpg";
      const contentType = `image/${ext === "jpg" ? "jpeg" : ext}`;
      const basePath = `${media.owner_id}/${media.invitation_id}/${media.purpose}/${mediaId}`;
      const finalPath = `${basePath}.${ext}`;

      const uploads = [
        { path: finalPath, label: "original" },
        { path: `${basePath}_thumbnail.${ext}`, label: "thumbnail" },
        { path: `${basePath}_medium.${ext}`, label: "medium" },
        { path: `${basePath}_large.${ext}`, label: "large" },
      ];

      for (const upload of uploads) {
        // Upload the Blob directly! Supabase Storage API fully supports it and it avoids Node Buffer corruption.
        const { error: uploadError } = await supabase.storage
          .from(FINAL_BUCKET)
          .upload(upload.path, fileData, {
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
          width: 0,
          height: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mediaId);

      await supabase.storage.from(QUARANTINE_BUCKET).remove([media.quarantine_path]).catch(() => {});

      return { success: true, finalPath, width: 0, height: 0 };
    }

    // Audio / Other
    const ext = media.original_filename?.split(".").pop() ?? "bin";
    const finalPath = `${media.owner_id}/${media.invitation_id}/${media.purpose}/${mediaId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(FINAL_BUCKET)
      .upload(finalPath, fileData, { upsert: true });

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
