import "server-only";

import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import type { InvitationCreateOrSyncInput } from "../schemas";
import type { CreatedInvitation } from "../types";

export class InvitationCreationError extends Error {
  constructor(message: string, readonly kind: "CONFLICT" | "NOT_FOUND" | "TEMPORARY") {
    super(message);
    this.name = "InvitationCreationError";
  }
}

export async function createOrSyncAtomic(
  userId: string,
  input: InvitationCreateOrSyncInput,
): Promise<CreatedInvitation> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("create_or_sync_invitation", {
    p_user_id: userId,
    p_client_ref: input.clientRef,
    p_theme_id: input.themeId,
    p_couple: input.couple,
    p_initial_event: input.initialEventDraft ?? null,
  });

  if (error) {
    if (error.code === "23505") throw new InvitationCreationError("Client reference conflict", "CONFLICT");
    if (error.code === "P0001" || error.code === "P0002") {
      throw new InvitationCreationError("Required profile or theme is unavailable", "NOT_FOUND");
    }
    throw new InvitationCreationError("Unable to create invitation", "TEMPORARY");
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new InvitationCreationError("Creation returned no result", "TEMPORARY");

  return {
    invitationId: row.invitation_id,
    slug: row.slug,
    contentVersion: row.content_version,
  };
}
