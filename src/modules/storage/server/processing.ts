import "server-only";

import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { detectMimeFromBytes } from "@/shared/lib/validation/magic-bytes";
import { validateMp4Audio } from "../audio-file-validation";
import { ALLOWED_MIME_TYPES, FINAL_BUCKET, QUARANTINE_BUCKET } from "../types";
import { detectImageFormat } from "./image-processor";

type ProcessResult = {
  success: boolean;
  finalPath?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  error?: string;
};

export async function processUploadedMedia(mediaId: string): Promise<ProcessResult> {
  const supabase = createSupabaseServiceClient();

  const { data: media } = await supabase
    .from("media_assets")
    .select("id, invitation_id, owner_id, kind, purpose, status, quarantine_path")
    .eq("id", mediaId)
    .maybeSingle();

  if (!media) return { success: false, error: "Media not found." };
  if (media.status !== "uploaded") return { success: false, error: `Media status is '${ media.status }', expected 'uploaded'.` };
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
      try {
        const arrayBuffer = await fileData.arrayBuffer();
        const firstBytes = new Uint8Array(arrayBuffer.slice(0, 16));

        const ext = detectImageFormat(firstBytes) ?? "jpg";
        const contentType = `image/${ ext === "jpg" ? "jpeg" : ext }`;
        const basePath = `${ media.owner_id }/${ media.invitation_id }/${ media.purpose }/${ mediaId }`;
        const finalPath = `${ basePath }.${ ext }`;

        // Upload original only for MVP (no variants) to prevent Edge Function timeout
        const { error: uploadError } = await supabase.storage
          .from(FINAL_BUCKET)
          .upload(finalPath, arrayBuffer, {
            contentType,
            upsert: true,
          });

        if (uploadError) {
          await supabase
            .from("media_assets")
            .update({ status: "rejected", failure_code: `UPLOAD_ORIGINAL_FAILED` })
            .eq("id", mediaId);
          return { success: false, error: `Failed to upload original variant.` };
        }

        const { error: dbError } = await supabase
          .from("media_assets")
          .update({
            status: "ready",
            final_path: finalPath,
            detected_mime: contentType,
            updated_at: new Date().toISOString(),
          })
          .eq("id", mediaId);

        if (dbError) {
          throw new Error(`Database error: ${ dbError.message }`);
        }

        await supabase.storage.from(QUARANTINE_BUCKET).remove([media.quarantine_path]).catch(() => { });

        return { success: true, finalPath, width: undefined, height: undefined };
      } catch (innerError) {
        await supabase
          .from("media_assets")
          .update({ status: "rejected", failure_code: String(innerError).substring(0, 50) })
          .eq("id", mediaId);
        return { success: false, error: String(innerError) };
      }
    }

    if (media.kind !== "audio") {
      await supabase
        .from("media_assets")
        .update({ status: "rejected", failure_code: "UNSUPPORTED_MEDIA_KIND" })
        .eq("id", mediaId);
      return { success: false, error: "Unsupported media kind." };
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const contentType = detectMimeFromBytes(bytes.subarray(0, 4100));
    if (!contentType || !ALLOWED_MIME_TYPES.audio.includes(contentType)) {
      await supabase
        .from("media_assets")
        .update({ status: "rejected", failure_code: "UNSUPPORTED_AUDIO_FORMAT" })
        .eq("id", mediaId);
      return { success: false, error: "Unsupported audio format." };
    }

    let durationSeconds: number | undefined;
    const extensionByMime: Record<string, string> = {
      "audio/mpeg": "mp3",
      "audio/mp4": "m4a",
      "audio/ogg": "ogg",
      "audio/wav": "wav",
      "audio/webm": "webm",
    };
    const ext = extensionByMime[contentType];
    if (!ext) {
      await supabase
        .from("media_assets")
        .update({ status: "rejected", failure_code: "UNSUPPORTED_AUDIO_FORMAT" })
        .eq("id", mediaId);
      return { success: false, error: "Unsupported audio format." };
    }

    if (contentType === "audio/mp4") {
      const validation = validateMp4Audio(bytes);
      if (!validation.valid) {
        await supabase
          .from("media_assets")
          .update({ status: "rejected", failure_code: validation.failureCode })
          .eq("id", mediaId);
        return { success: false, error: "Invalid M4A audio file." };
      }
      durationSeconds = validation.durationSeconds;
    }

    const finalPath = `${media.owner_id}/${media.invitation_id}/${media.purpose}/${mediaId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(FINAL_BUCKET)
      .upload(finalPath, arrayBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      await supabase
        .from("media_assets")
        .update({ status: "rejected", failure_code: "UPLOAD_FINAL_FAILED" })
        .eq("id", mediaId);
      return { success: false, error: "Failed to upload final media." };
    }

    const { error: dbError } = await supabase
      .from("media_assets")
      .update({
        status: "ready",
        final_path: finalPath,
        detected_mime: contentType,
        duration_seconds: durationSeconds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mediaId);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    await supabase.storage.from(QUARANTINE_BUCKET).remove([media.quarantine_path]).catch(() => {});

    return { success: true, finalPath, durationSeconds };
  } catch (error) {
    await supabase
      .from("media_assets")
      .update({ status: "rejected", failure_code: "PROCESSING_ERROR" })
      .eq("id", mediaId);
    return { success: false, error: error instanceof Error ? error.message : "Processing failed." };
  }
}
