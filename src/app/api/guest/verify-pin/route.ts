import { NextResponse, type NextRequest } from "next/server";
import { verifyPinAndCreateSession, PinError } from "@/modules/guest/server/pin-session";
import { extractIpFromHeaders } from "@/shared/lib/rate-limit";
import { verifyTurnstileToken } from "@/shared/lib/security/turnstile";
import {
  checkPinDefense,
  recordPinFailure,
  clearPinBlockOnSuccess,
  incrementHeightenedAttempt,
} from "@/shared/lib/security/pin-defense";
import {
  createOrUpdateIncident,
  checkIncidentStatus,
  isIncidentActive,
} from "@/shared/lib/security/incident";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { invitationId, pin, turnstileToken } = body;

    if (!invitationId || !pin) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 },
      );
    }

    const ip = extractIpFromHeaders(request.headers);

    const defense = await checkPinDefense(invitationId, ip);

    if (!defense.allowed) {
      if (defense.level === "heightened") {
        const attemptCheck = await incrementHeightenedAttempt(invitationId, ip);
        if (!attemptCheck.allowed) {
          return NextResponse.json(
            {
              success: false,
              error: "Terlalu banyak percobaan. Mode perlindungan aktif.",
              retryAfterMs: defense.blockExpiresAt
                ? (defense.blockExpiresAt - Math.floor(Date.now() / 1000)) * 1000
                : undefined,
              heightened: true,
            },
            { status: 429 },
          );
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: defense.level === "blocked_1h"
              ? "Akses ditangguhkan sementara karena aktivitas mencurigakan."
              : "Terlalu banyak percobaan. Silakan coba lagi nanti.",
            retryAfterMs: defense.blockExpiresAt
              ? (defense.blockExpiresAt - Math.floor(Date.now() / 1000)) * 1000
              : undefined,
          },
          { status: 429 },
        );
      }
    }

    if (defense.requiresTurnstile) {
      if (!turnstileToken) {
        return NextResponse.json(
          {
            success: false,
            error: "Verifikasi diperlukan. Silakan selesaikan captcha.",
            requiresTurnstile: true,
          },
          { status: 403 },
        );
      }

      const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
      if (!turnstileResult.success) {
        return NextResponse.json(
          { success: false, error: turnstileResult.error ?? "Verifikasi gagal." },
          { status: 403 },
        );
      }
    }

    try {
      await verifyPinAndCreateSession(invitationId, pin);
      await clearPinBlockOnSuccess(invitationId, ip);
      return NextResponse.json({ success: true });
    } catch (error) {
      if (error instanceof PinError && error.code === "INVALID_PIN") {
        const failureResult = await recordPinFailure(invitationId, ip);

        if (failureResult.level === "heightened") {
          const incidentResult = await createOrUpdateIncident(invitationId);
          if (incidentResult.shouldSendAlert) {
            console.error(
              `[SECURITY] Heightened protection triggered for invitation ${invitationId}`,
            );
          }
        }

        const incidentCheck = await checkIncidentStatus(invitationId);
        if (incidentCheck?.shouldSendRecovery) {
          console.error(
            `[SECURITY] Incident closed for invitation ${invitationId} - sending recovery notification`,
          );
        }

        return NextResponse.json(
          {
            success: false,
            error: "PIN salah.",
            defenseLevel: failureResult.level,
          },
          { status: 400 },
        );
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof PinError) {
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
