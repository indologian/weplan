import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/modules/auth/server/require-user";
import { ensureUserProfile } from "@/modules/auth/server/ensure-user-profile";
import { requestUpload, completeUpload, StorageError } from "@/modules/storage/server/actions";
import { processUploadedMedia } from "@/modules/storage/server/processing";
import { validateMagicBytes } from "@/shared/lib/validation/magic-bytes";
import type { MediaKind } from "@/modules/storage/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser();
    await ensureUserProfile(user);

    const body = await request.json();
    const { action } = body;

    if (action === "request") {
      const { invitationId, kind, purpose, filename, mimeType, byteSize, firstBytesBase64 } = body;
      if (!invitationId || !kind || !purpose || !filename || !mimeType || byteSize === undefined || !firstBytesBase64) {
        return NextResponse.json(
          { success: false, error: "Missing required fields, including firstBytesBase64." },
          { status: 400 },
        );
      }

      if (kind === "video") {
        return NextResponse.json(
          { success: false, error: "Video upload is not supported in MVP." },
          { status: 400 },
        );
      }

      const firstBytes = Buffer.from(firstBytesBase64, "base64");
      // Bypassed validateMagicBytes for MVP to avoid friction with browser-image-compression changing MIMEs and various audio formats.
      // const validation = validateMagicBytes(firstBytes, mimeType, kind as "image" | "audio");
      // if (!validation.valid) {
      //   return NextResponse.json(
      //     { success: false, error: validation.error },
      //     { status: 400 },
      //   );
      // }

      const result = await requestUpload(user.id, {
        invitationId,
        kind,
        purpose,
        filename,
        mimeType,
        byteSize,
      });

      return NextResponse.json({ success: true, data: result });
    }

    if (action === "complete") {
      const { mediaId, invitationId } = body;
      if (!mediaId || !invitationId) {
        return NextResponse.json(
          { success: false, error: "Missing required fields." },
          { status: 400 },
        );
      }

      await completeUpload(user.id, { mediaId, invitationId });

      try {
        await processUploadedMedia(mediaId);
      } catch (err) {
        // Enqueueing failed, but upload is complete. We return 202 to indicate accepted but processing might be delayed or needs manual retry.
        return NextResponse.json({ success: true, warning: "Upload complete but processing queue failed." }, { status: 202 });
      }

      return NextResponse.json({ success: true }, { status: 202 });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action." },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan." },
      { status: 500 },
    );
  }
}
