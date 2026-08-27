import { NextResponse, type NextRequest } from "next/server";
import { getMediaServingUrl, StorageError } from "@/modules/storage/server/actions";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> },
): Promise<NextResponse> {
  try {
    const { mediaId } = await params;

    if (!mediaId) {
      return NextResponse.json(
        { success: false, error: "Missing mediaId." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServiceClient();
    const { data: media } = await supabase
      .from("media_assets")
      .select("id, invitation_id, status, final_path, kind")
      .eq("id", mediaId)
      .maybeSingle();

    if (!media) {
      return NextResponse.json(
        { success: false, error: "Media not found." },
        { status: 404 },
      );
    }

    if (media.status !== "ready") {
      return NextResponse.json(
        { success: false, error: "Media is not ready." },
        { status: 404 },
      );
    }

    const result = await getMediaServingUrl(mediaId, "original");

    return NextResponse.redirect(result.url, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan." },
      { status: 500 },
    );
  }
}
