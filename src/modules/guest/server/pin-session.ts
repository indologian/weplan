import "server-only";

import { cookies } from "next/headers";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { verifyPrivateSession, signPrivateSession } from "./private-session";
import { verifyGuestToken, hashGuestToken } from "./token";

const PRIVATE_SESSION_SECRET = process.env.PRIVATE_SESSION_KEY_CURRENT ?? "";
const GUEST_TOKEN_SECRET = process.env.GUEST_TOKEN_HMAC_SECRET ?? "";
const SESSION_COOKIE_NAME = "private_session";

export class PinError extends Error {
  constructor(
    message: string,
    public readonly code: "INVALID_PIN" | "INVITATION_NOT_FOUND" | "NOT_PRIVATE" | "DATABASE_ERROR" | "SESSION_INVALID",
  ) {
    super(message);
    this.name = "PinError";
  }
}

export async function verifyPinAndCreateSession(
  invitationId: string,
  pin: string,
): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, is_private, pin_version")
    .eq("id", invitationId)
    .eq("status", "published")
    .maybeSingle();

  if (!invitation) throw new PinError("Invitation not found", "INVITATION_NOT_FOUND");
  if (!invitation.is_private) throw new PinError("Invitation is not private", "NOT_PRIVATE");

  const { data: credential } = await supabase
    .from("invitation_pin_credentials")
    .select("pin_hash")
    .eq("invitation_id", invitationId)
    .maybeSingle();

  if (!credential) throw new PinError("PIN credential not found", "DATABASE_ERROR");

  const { data: verifyResult } = await supabase.functions.invoke("pin-crypto", {
    body: { action: "verify", pin, hash: credential.pin_hash },
  });

  if (!verifyResult?.valid) {
    throw new PinError("Invalid PIN", "INVALID_PIN");
  }

  const sessionToken = signPrivateSession(
    {
      invitation_id: invitationId,
      pin_version: invitation.pin_version,
      issued_at: Math.floor(Date.now() / 1000),
    },
    PRIVATE_SESSION_SECRET,
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 6 * 60 * 60,
  });
}

export async function verifyPrivateSessionFromCookie(
  invitationId: string,
): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie) return false;

  const supabase = createSupabaseServiceClient();
  const { data: invitation } = await supabase
    .from("invitations")
    .select("pin_version")
    .eq("id", invitationId)
    .maybeSingle();

  if (!invitation) return false;

  const result = verifyPrivateSession(
    sessionCookie.value,
    PRIVATE_SESSION_SECRET,
    invitation.pin_version,
    Math.floor(Date.now() / 1000),
  );

  if (!result.valid) return false;
  if (result.payload?.invitation_id !== invitationId) return false;

  return true;
}

export async function resolveGuestFromToken(
  invitationId: string,
  guestToken: string,
): Promise<{ guestId: string; name: string } | null> {
  const supabase = createSupabaseServiceClient();
  const tokenHash = hashGuestToken(guestToken, GUEST_TOKEN_SECRET);

  const { data: credential } = await supabase
    .from("guest_credentials")
    .select("guest_id")
    .eq("access_token_hash", tokenHash)
    .maybeSingle();

  if (!credential) return null;

  const { data: guest } = await supabase
    .from("guests")
    .select("id, name")
    .eq("id", credential.guest_id)
    .eq("invitation_id", invitationId)
    .maybeSingle();

  if (!guest) return null;

  return { guestId: guest.id, name: guest.name };
}
