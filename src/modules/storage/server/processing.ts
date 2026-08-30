import "server-only";

import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { FINAL_BUCKET, QUARANTINE_BUCKET } from "../types";
import { canonicalizeAudio, probeAudio } from "./audio-probe";
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

    // Audio / Other
    const arrayBuffer = await fileData.arrayBuffer();
    const audioBytes = new Uint8Array(arrayBuffer);

    // Structural audio probe — fail-closed. Media tidak akan mencapai
    // status "ready" kecuali terbukti audio-only (tidak ada track video).
    const canon = canonicalizeAudio(audioBytes);
    if (!canon) {
      const probeResult = probeAudio(audioBytes);
      const reason = probeResult.status === "rejected" ? probeResult.reason : "unknown";
      await supabase
        .from("media_assets")
        .update({ status: "rejected", failure_code: `AUDIO_PROBE_${ reason.toUpperCase() }` })
        .eq("id", mediaId);
      await supabase.storage
        .from(QUARANTINE_BUCKET)
        .remove([media.quarantine_path])
        .catch(() => { });
      return {
        success: false,
        error:
          reason === "has-video"
            ? "File mengandung track video. Unggah audio-only (MP3/M4A)."
            : reason === "truncated"
              ? "File audio tidak lengkap atau rusak."
              : reason === "adts-use-m4a"
                ? "AAC mentah tidak didukung. Gunakan kontainer M4A."
                : "Format audio tidak dikenali.",
      };
    }

    const ext = canon.ext;
    const contentType = canon.mime;
    const finalPath = `${ media.owner_id }/${ media.invitation_id }/${ media.purpose }/${ mediaId }.${ ext }`;

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

    await supabase
      .from("media_assets")
      .update({
        status: "ready",
        final_path: finalPath,
        detected_mime: contentType,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mediaId);

    await supabase.storage.from(QUARANTINE_BUCKET).remove([media.quarantine_path]).catch(() => { });

    return { success: true, finalPath };
  } catch (error) {
    await supabase
      .from("media_assets")
      .update({ status: "rejected", failure_code: "PROCESSING_ERROR" })
      .eq("id", mediaId);
    return { success: false, error: error instanceof Error ? error.message : "Processing failed." };
  }
}
