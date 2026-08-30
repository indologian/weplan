import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { getKnownRendererKeys } from "../theme-registry";
import type {
  EditorContentAutosaveInput,
  EditorEventDeleteInput,
  EditorEventReorderInput,
  EditorEventSaveInput,
  EditorGalleryReplaceInput,
  EditorUpdatePrivacyInput,
  EditorUpdateRsvpConfigInput,
  EditorUpdateThemeInput,
  InvitationCreateOrSyncInput,
} from "../schemas";
import type { CreatedInvitation } from "../types";

export class InvitationCreationError extends Error {
  constructor(message: string, readonly kind: "CONFLICT" | "NOT_FOUND" | "TEMPORARY") {
    super(message);
    this.name = "InvitationCreationError";
  }
}

export type EditorMutationErrorKind =
  | "VERSION_CONFLICT"
  | "NOT_FOUND"
  | "INVALID_STATE"
  | "THEME_LIMIT_CONFLICT"
  | "TEMPORARY_ERROR";

export class EditorMutationError extends Error {
  constructor(
    message: string,
    readonly kind: EditorMutationErrorKind,
    readonly serverVersion?: number,
  ) {
    super(message);
    this.name = "EditorMutationError";
  }
}

function mapEditorMutationError(error: PostgrestError): EditorMutationError {
  const conflict = error.message.match(/VERSION_CONFLICT:(\d+)/u);
  if (conflict) {
    return new EditorMutationError("Stale content version", "VERSION_CONFLICT", Number(conflict[1]));
  }
  if (error.message.includes("NOT_FOUND") || error.message.includes("EVENT_NOT_FOUND")) {
    return new EditorMutationError("Editor resource was not found", "NOT_FOUND");
  }
  if (error.message.includes("THEME_LIMIT_CONFLICT") || error.message.includes("LIMIT_CONFLICT")) {
    return new EditorMutationError("Current content exceeds the selected tier", "THEME_LIMIT_CONFLICT");
  }
  if (
    error.code === "23505"
    || error.message.includes("INVALID_")
    || error.message.includes("PIN_REQUIRED")
    || error.message.includes("THEME_NOT_AVAILABLE")
    || error.message.includes("THEME_ENTITLEMENT_CONFLICT")
  ) {
    return new EditorMutationError("Mutation is not valid in the current state", "INVALID_STATE");
  }
  return new EditorMutationError("Editor mutation failed", "TEMPORARY_ERROR");
}

function requireVersion(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new EditorMutationError("Mutation returned an invalid revision", "TEMPORARY_ERROR");
  }
  return value;
}

function isEventMutationResult(
  value: unknown,
): value is { content_version: number; event_id: string } {
  return value !== null
    && typeof value === "object"
    && "content_version" in value
    && typeof value.content_version === "number"
    && "event_id" in value
    && typeof value.event_id === "string";
}

function containsUnsupportedM2Content(input: EditorContentAutosaveInput): boolean {
  const people = [input.couple?.groom, input.couple?.bride];
  if (people.some((person) => person?.photoMediaId !== undefined)) return true;
  if (input.loveStory?.some((item) => item.photoMediaId !== undefined)) return true;
  if (input.bankAccounts?.some((item) => item.qrisMediaId !== undefined)) return true;
  if (input.settings?.backgroundAudioMediaId !== undefined) return true;
  return input.settings?.themeOverrides != null
    && Object.keys(input.settings.themeOverrides).length > 0;
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

export async function saveEditorContent(
  userId: string,
  input: EditorContentAutosaveInput,
): Promise<number> {
  const supabase = createSupabaseServiceClient();
  
  // Collect all media IDs and their expected configurations
  // Validate theme overrides against active theme's editable_overrides
  if (input.settings?.themeOverrides && Object.keys(input.settings.themeOverrides).length > 0) {
    const { data: themeInfo, error: themeError } = await supabase
      .from("invitations")
      .select("theme_id, themes!inner(editable_overrides)")
      .eq("id", input.invitationId)
      .maybeSingle();

    if (themeError) throw new EditorMutationError("Database error during theme validation", "TEMPORARY_ERROR");
    if (!themeInfo || !themeInfo.themes) throw new EditorMutationError("Invitation or theme not found", "NOT_FOUND");

    const themesData = themeInfo.themes as unknown as { editable_overrides: string[] };
    const allowedKeys = themesData.editable_overrides || [];
    const overrides = input.settings.themeOverrides;

    for (const key of Object.keys(overrides)) {
      if (!allowedKeys.includes(key)) {
        throw new EditorMutationError(`Theme override key not allowed by active theme: ${key}`, "INVALID_STATE");
      }
    }
  }

  const validations: { id: string, kind: string, purpose: string }[] = [];
  
  if (input.couple?.groom?.photoMediaId) {
    validations.push({ id: input.couple.groom.photoMediaId, kind: 'image', purpose: 'couple_portrait' });
  }
  if (input.couple?.bride?.photoMediaId) {
    validations.push({ id: input.couple.bride.photoMediaId, kind: 'image', purpose: 'couple_portrait' });
  }
  
  input.loveStory?.forEach(story => {
    if (story.photoMediaId) {
      validations.push({ id: story.photoMediaId, kind: 'image', purpose: 'story_image' });
    }
  });
  
  input.bankAccounts?.forEach(account => {
    if (account.qrisMediaId) {
      validations.push({ id: account.qrisMediaId, kind: 'image', purpose: 'qris_image' });
    }
  });
  
  if (input.settings?.backgroundAudioMediaId) {
    validations.push({ id: input.settings.backgroundAudioMediaId, kind: 'audio', purpose: 'background_audio' });
  }

  // Validate all collected media IDs
  if (validations.length > 0) {
    const ids = validations.map(v => v.id);
    const { data: assets, error: assetError } = await supabase
      .from("media_assets")
      .select("id, kind, purpose, status")
      .eq("invitation_id", input.invitationId)
      .eq("owner_id", userId)
      .in("id", ids);
      
    if (assetError) throw new EditorMutationError("Failed to validate media assets", "INVALID_STATE");
    
    const assetMap = new Map((assets || []).map(a => [a.id, a]));
    
    for (const v of validations) {
      const asset = assetMap.get(v.id);
      if (!asset) throw new EditorMutationError(`Media ${v.id} not found or not owned`, "INVALID_STATE");
      if (asset.status !== "ready") throw new EditorMutationError(`Media ${v.id} is not ready`, "INVALID_STATE");
      if (asset.kind !== v.kind) throw new EditorMutationError(`Media ${v.id} is not of kind ${v.kind}`, "INVALID_STATE");
      if (asset.purpose !== v.purpose) throw new EditorMutationError(`Media ${v.id} is not for purpose ${v.purpose}`, "INVALID_STATE");
    }
  }

  const { data, error } = await supabase.rpc("save_invitation_content", {
    p_user_id: userId,
    p_invitation_id: input.invitationId,
    p_expected_version: input.expectedVersion,
    p_couple: input.couple ?? null,
    p_love_story: input.loveStory ?? null,
    p_bank_accounts: input.bankAccounts ?? null,
    p_settings: input.settings ?? null,
  });
  
  if (error) throw mapEditorMutationError(error);
  return requireVersion(data);
}

export async function saveEditorEvent(
  userId: string,
  input: EditorEventSaveInput,
): Promise<{ contentVersion: number; eventId: string }> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("save_invitation_event", {
    p_user_id: userId,
    p_invitation_id: input.invitationId,
    p_expected_version: input.expectedVersion,
    p_event_id: input.eventId ?? null,
    p_position: input.data.position,
    p_event_type: input.data.eventType,
    p_title: input.data.title,
    p_starts_at: input.data.startsAt ?? null,
    p_ends_at: input.data.endsAt ?? null,
    p_timezone: input.data.timezone ?? null,
    p_venue_name: input.data.venueName,
    p_address: input.data.address,
    p_latitude: input.data.latitude ?? null,
    p_longitude: input.data.longitude ?? null,
  });
  if (error) throw mapEditorMutationError(error);
  if (!isEventMutationResult(data)) {
    throw new EditorMutationError("Event mutation returned invalid data", "TEMPORARY_ERROR");
  }
  return { contentVersion: requireVersion(data.content_version), eventId: data.event_id };
}

export async function replaceEditorGallery(
  userId: string,
  input: EditorGalleryReplaceInput,
): Promise<number> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("replace_invitation_gallery", {
    p_user_id: userId,
    p_invitation_id: input.invitationId,
    p_expected_version: input.expectedVersion,
    p_media_asset_ids: input.mediaAssetIds,
  });
  if (error) throw mapEditorMutationError(error);
  return requireVersion(data);
}

export async function deleteEditorEvent(
  userId: string,
  input: EditorEventDeleteInput,
): Promise<number> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("delete_invitation_event", {
    p_user_id: userId,
    p_invitation_id: input.invitationId,
    p_expected_version: input.expectedVersion,
    p_event_id: input.eventId,
  });
  if (error) throw mapEditorMutationError(error);
  return requireVersion(data);
}

export async function reorderEditorEvents(
  userId: string,
  input: EditorEventReorderInput,
): Promise<number> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("reorder_invitation_events", {
    p_user_id: userId,
    p_invitation_id: input.invitationId,
    p_expected_version: input.expectedVersion,
    p_event_ids: input.eventIds,
  });
  if (error) throw mapEditorMutationError(error);
  return requireVersion(data);
}

export async function updateEditorTheme(
  userId: string,
  input: EditorUpdateThemeInput,
): Promise<number> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("update_invitation_theme", {
    p_user_id: userId,
    p_invitation_id: input.invitationId,
    p_expected_version: input.expectedVersion,
    p_theme_id: input.themeId,
    p_known_renderer_keys: getKnownRendererKeys(),
  });
  if (error) throw mapEditorMutationError(error);
  return requireVersion(data);
}

export type PinCredentialContext = {
  contentVersion: number;
  hasCurrentPin: boolean;
  comparisonHashes: string[];
};

export async function getPinCredentialContext(
  userId: string,
  invitationId: string,
): Promise<PinCredentialContext> {
  const supabase = createSupabaseServiceClient();
  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("id,content_version")
    .eq("id", invitationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (invitationError) throw new EditorMutationError("Unable to load PIN context", "TEMPORARY_ERROR");
  if (!invitation) throw new EditorMutationError("Invitation not found", "NOT_FOUND");

  const [{ data: credential, error: credentialError }, { data: history, error: historyError }] = await Promise.all([
    supabase
      .from("invitation_pin_credentials")
      .select("pin_hash")
      .eq("invitation_id", invitationId)
      .maybeSingle(),
    supabase
      .from("pin_history")
      .select("pin_hash")
      .eq("invitation_id", invitationId)
      .order("replaced_at", { ascending: false })
      .limit(3),
  ]);
  if (credentialError || historyError) {
    throw new EditorMutationError("Unable to load PIN context", "TEMPORARY_ERROR");
  }

  return {
    contentVersion: invitation.content_version,
    hasCurrentPin: credential !== null,
    comparisonHashes: [credential?.pin_hash, ...(history ?? []).map((row) => row.pin_hash)]
      .filter((hash): hash is string => typeof hash === "string")
      .slice(0, 4),
  };
}

export async function updateEditorPrivacy(
  userId: string,
  input: EditorUpdatePrivacyInput,
  pinHash?: string,
): Promise<number> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("update_invitation_privacy", {
    p_user_id: userId,
    p_invitation_id: input.invitationId,
    p_expected_version: input.expectedVersion,
    p_is_private: input.isPrivate,
    p_pin_hash: pinHash ?? null,
  });
  if (error) throw mapEditorMutationError(error);
  return requireVersion(data);
}

export async function updateEditorRsvpConfig(
  userId: string,
  input: EditorUpdateRsvpConfigInput,
): Promise<number> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("update_invitation_rsvp_config", {
    p_user_id: userId,
    p_invitation_id: input.invitationId,
    p_expected_version: input.expectedVersion,
    p_rsvp_mode: input.rsvpMode,
    p_guestbook_moderation: input.guestbookModeration,
  });
  if (error) throw mapEditorMutationError(error);
  return requireVersion(data);
}
