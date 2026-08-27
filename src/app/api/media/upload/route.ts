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
      const { invitationId, kind, purpose, filename, mimeType, byteSize } = body;
      if (!invitationId || !kind || !purpose || !filename || !mimeType || byteSize === undefined) {
        return NextResponse.json(
          { success: false, error: "Missing required fields." },
          { status: 400 },
        );
      }

      if (kind === "video") {
        return NextResponse.json(
          { success: false, error: "Video upload is not supported in MVP." },
          { status: 400 },
        );
      }

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

      const processingResult = await processUploadedMedia(mediaId);
      if (!processingResult.success) {
        return NextResponse.json({
          success: false,
          error: processingResult.error ?? "Processing failed.",
        }, { status: 422 });
      }

      return NextResponse.json({ success: true });
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
