import { NextResponse, type NextRequest } from "next/server";
import { verifyPinAndCreateSession, PinError } from "@/modules/guest/server/pin-session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { invitationId, pin } = body;

    if (!invitationId || !pin) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    await verifyPinAndCreateSession(invitationId, pin);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PinError) {
      return NextResponse.json({ success: false, error: error.message });
    }
    return NextResponse.json({ success: false, error: "Terjadi kesalahan." }, { status: 500 });
  }
}
