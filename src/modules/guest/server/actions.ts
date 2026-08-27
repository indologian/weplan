import "server-only";

import { z } from "zod";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { hashGuestToken, createGuestToken, hashRsvpEditToken, createRsvpEditToken } from "./token";

const RSVP_SECRET = process.env.GUEST_TOKEN_HMAC_SECRET ?? "";

export class GuestError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "INVITATION_PRIVATE" | "INVITATION_NOT_OPEN" | "DATABASE_ERROR" | "RATE_LIMITED",
  ) {
    super(message);
    this.name = "GuestError";
  }
}

const rsvpSubmissionSchema = z.object({
  invitationId: z.string().uuid(),
  name: z.string().min(1).max(160),
  phone: z.string().min(1).max(20),
  attendance: z.enum(["confirmed", "declined"]),
  guestCount: z.number().int().min(0).max(10),
  wishMessage: z.string().max(500).optional(),
}).strict().superRefine((input, context) => {
  if (input.attendance === "confirmed" && input.guestCount < 1) {
    context.addIssue({ code: "custom", path: ["guestCount"], message: "Confirmed attendance requires at least one guest" });
  }
  if (input.attendance === "declined" && input.guestCount !== 0) {
    context.addIssue({ code: "custom", path: ["guestCount"], message: "Declined attendance must have zero guests" });
  }
});

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, "").trim();
}

export async function submitRsvp(input: unknown): Promise<{ guestId: string; editToken?: string }> {
  const validated = rsvpSubmissionSchema.parse(input);

  const supabase = createSupabaseServiceClient();

  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, rsvp_mode, status")
    .eq("id", validated.invitationId)
    .eq("status", "published")
    .maybeSingle();

  if (!invitation) throw new GuestError("Invitation not found", "NOT_FOUND");
  if (invitation.rsvp_mode !== "open") throw new GuestError("RSVP is not open", "INVITATION_NOT_OPEN");

  const normalizedPhone = normalizePhone(validated.phone);

  const { data: existingGuest } = await supabase
    .from("guests")
    .select("id")
    .eq("invitation_id", validated.invitationId)
    .eq("normalized_phone", normalizedPhone)
    .maybeSingle();

  let guestId: string;

  if (existingGuest) {
    guestId = existingGuest.id;
    await supabase
      .from("guests")
      .update({
        rsvp_status: validated.attendance,
        attendance: validated.guestCount,
        wish_message: validated.wishMessage || null,
        wish_status: validated.wishMessage ? "approved" : "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", guestId);
  } else {
    const { data: newGuest, error } = await supabase
      .from("guests")
      .insert({
        invitation_id: validated.invitationId,
        name: validated.name,
        phone: validated.phone,
        normalized_phone: normalizedPhone,
        guest_source: "public_rsvp",
        rsvp_status: validated.attendance,
        attendance: validated.guestCount,
        wish_message: validated.wishMessage || null,
        wish_status: validated.wishMessage ? "approved" : "pending",
      })
      .select("id")
      .single();

    if (error) throw new GuestError("Failed to create guest", "DATABASE_ERROR");
    guestId = newGuest.id;

    const editToken = createRsvpEditToken();
    const editTokenHash = hashRsvpEditToken(editToken, RSVP_SECRET);

    await supabase.from("guest_credentials").insert({
      guest_id: guestId,
      rsvp_edit_token_hash: editTokenHash,
      token_created_at: new Date().toISOString(),
    });

    return { guestId, editToken };
  }

  return { guestId };
}

export async function submitWish(
  invitationId: string,
  guestId: string,
  wishMessage: string,
): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, guestbook_moderation")
    .eq("id", invitationId)
    .eq("status", "published")
    .maybeSingle();

  if (!invitation) throw new GuestError("Invitation not found", "NOT_FOUND");

  const wishStatus = invitation.guestbook_moderation === "auto" ? "approved" : "pending";

  await supabase
    .from("guests")
    .update({
      wish_message: wishMessage,
      wish_status: wishStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", guestId)
    .eq("invitation_id", invitationId);
}

export async function getPublicWishes(invitationId: string): Promise<Array<{
  name: string;
  attendance: string;
  wishMessage: string;
  createdAt: string;
}>> {
  const supabase = createSupabaseServiceClient();

  const { data } = await supabase
    .from("guests")
    .select("name, attendance, wish_message, created_at")
    .eq("invitation_id", invitationId)
    .eq("wish_status", "approved")
    .not("wish_message", "is", null)
    .order("created_at", { ascending: true });

  return (data ?? []).map((g) => ({
    name: g.name,
    attendance: g.attendance > 0 ? "Hadir" : "Tidak Hadir",
    wishMessage: g.wish_message ?? "",
    createdAt: g.created_at,
  }));
}
