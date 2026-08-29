import { NextResponse, type NextRequest } from "next/server";
import { getMediaServingUrl, StorageError } from "@/modules/storage/server/actions";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ mediaId: string; variant: string }> },
): Promise<NextResponse> {
  try {
    const { mediaId, variant } = await params;

    if (!mediaId || !variant) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters." },
        { status: 400 },
      );
    }

    const result = await getMediaServingUrl(mediaId, variant);

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
