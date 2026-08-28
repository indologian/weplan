import "server-only";

import { z } from "zod";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import {
  bankAccountItemSchema,
  invitationCoupleSchema,
  invitationSettingsSchema,
  loveStoryItemSchema,
} from "../schemas";
import { getKnownRendererKeys } from "../theme-registry";
import {
  evaluatePublishReadinessSnapshot,
  type PublishReadinessResult,
} from "../publish-readiness";
import { EditorMutationError } from "./repository";

const invitationReadinessRowSchema = z.object({
  content_version: z.number().int().positive(),
  couple: invitationCoupleSchema,
  love_story: z.array(loveStoryItemSchema),
  bank_accounts: z.array(bankAccountItemSchema),
  settings: invitationSettingsSchema,
  is_private: z.boolean(),
  theme_id: z.uuid(),
  entitlement_tier_id: z.uuid().nullable(),
  entitlement_snapshot: z.object({
    gallery_limit: z.number().int().nonnegative(),
    bank_account_limit: z.number().int().nonnegative(),
    video_limit: z.number().int().nonnegative(),
    audio_enabled: z.boolean(),
  }).nullable(),
}).strict();

const eventReadinessRowSchema = z.object({
  title: z.string(),
  starts_at: z.string().nullable(),
  timezone: z.string().nullable(),
}).strict();

const themeReadinessRowSchema = z.object({
  renderer_key: z.string().min(1),
  is_active: z.boolean(),
  tier_id: z.uuid(),
  layout_config: z.unknown(),
}).strict();

const tierReadinessRowSchema = z.object({
  is_active: z.boolean(),
  tier_rank: z.number().int().nonnegative(),
  gallery_limit: z.number().int().nonnegative(),
  bank_account_limit: z.number().int().nonnegative(),
  video_limit: z.number().int().nonnegative(),
  audio_enabled: z.boolean(),
}).strict();

const galleryReadinessRowSchema = z.object({
  media_asset_id: z.uuid(),
}).strict();

const mediaReadinessRowSchema = z.object({
  id: z.uuid(),
  status: z.string(),
}).strict();

function collectReferencedMediaIds(
  invitation: z.infer<typeof invitationReadinessRowSchema>,
): string[] {
  return [
    invitation.couple.groom?.photoMediaId,
    invitation.couple.bride?.photoMediaId,
    ...invitation.love_story.map((item) => item.photoMediaId),
    ...invitation.bank_accounts.map((item) => item.qrisMediaId),
    invitation.settings.backgroundAudioMediaId,
  ].filter((id): id is string => typeof id === "string");
}

export type VersionedPublishReadinessResult = {
  contentVersion: number | null;
  result: PublishReadinessResult;
};

export async function evaluatePublishReadinessAtVersion(
  userId: string,
  invitationId: string,
): Promise<VersionedPublishReadinessResult> {
  const supabase = createSupabaseServiceClient();
  const { data: rawInvitation, error: invitationError } = await supabase
    .from("invitations")
    .select("content_version,couple,love_story,bank_accounts,settings,is_private,theme_id,entitlement_tier_id,entitlement_snapshot")
    .eq("id", invitationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (invitationError) {
    throw new EditorMutationError("Unable to evaluate publish readiness", "TEMPORARY_ERROR");
  }
  if (!rawInvitation) {
    return {
      contentVersion: null,
      result: {
        isReady: false,
        issues: [{ code: "NOT_FOUND", path: "invitationId", message: "Undangan tidak ditemukan." }],
      },
    };
  }

  const invitation = invitationReadinessRowSchema.parse(rawInvitation);
  const [eventsResult, themeResult, credentialResult, galleryResult] = await Promise.all([
    supabase
      .from("invitation_events")
      .select("title,starts_at,timezone")
      .eq("invitation_id", invitationId)
      .order("position", { ascending: true }),
    supabase
      .from("themes")
      .select("renderer_key,is_active,tier_id,layout_config")
      .eq("id", invitation.theme_id)
      .maybeSingle(),
    supabase
      .from("invitation_pin_credentials")
      .select("invitation_id", { count: "exact", head: true })
      .eq("invitation_id", invitationId),
    supabase
      .from("invitation_gallery_items")
      .select("media_asset_id")
      .eq("invitation_id", invitationId),
  ]);
  if (eventsResult.error || themeResult.error || credentialResult.error || galleryResult.error) {
    throw new EditorMutationError("Unable to evaluate publish readiness", "TEMPORARY_ERROR");
  }

  const events = z.array(eventReadinessRowSchema).parse(eventsResult.data ?? []);
  const galleryItems = z.array(galleryReadinessRowSchema).parse(galleryResult.data ?? []);
  const theme = themeResult.data ? themeReadinessRowSchema.parse(themeResult.data) : null;
  const { data: rawThemeTier, error: themeTierError } = theme?.tier_id
    ? await supabase
      .from("tiers")
      .select("is_active,tier_rank,gallery_limit,bank_account_limit,video_limit,audio_enabled")
      .eq("id", theme.tier_id)
      .maybeSingle()
    : { data: null, error: null };
  if (themeTierError) {
    throw new EditorMutationError("Unable to evaluate publish readiness", "TEMPORARY_ERROR");
  }
  const themeTier = rawThemeTier ? tierReadinessRowSchema.parse(rawThemeTier) : null;

  const { data: rawEntitlementTier, error: entitlementTierError } = invitation.entitlement_tier_id
    ? await supabase
      .from("tiers")
      .select("is_active,tier_rank,gallery_limit,bank_account_limit,video_limit,audio_enabled")
      .eq("id", invitation.entitlement_tier_id)
      .maybeSingle()
    : { data: null, error: null };
  if (entitlementTierError) {
    throw new EditorMutationError("Unable to evaluate publish readiness", "TEMPORARY_ERROR");
  }
  const entitlementTier = rawEntitlementTier
    ? tierReadinessRowSchema.parse(rawEntitlementTier)
    : null;
  const hasValidEntitlement = invitation.entitlement_tier_id === null
    || Boolean(
      invitation.entitlement_snapshot
      && entitlementTier
      && themeTier
      && themeTier.tier_rank <= entitlementTier.tier_rank,
    );
  const allowance = invitation.entitlement_snapshot ?? {
    gallery_limit: themeTier?.gallery_limit ?? 0,
    bank_account_limit: themeTier?.bank_account_limit ?? 0,
    video_limit: themeTier?.video_limit ?? 0,
    audio_enabled: themeTier?.audio_enabled ?? false,
  };

  const referencedMediaIds = [...new Set([
    ...collectReferencedMediaIds(invitation),
    ...galleryItems.map((item) => item.media_asset_id),
  ])];
  const mediaResult = referencedMediaIds.length > 0
    ? await supabase
      .from("media_assets")
      .select("id,status")
      .eq("invitation_id", invitationId)
      .in("id", referencedMediaIds)
    : { data: [], error: null };
  if (mediaResult.error) {
    throw new EditorMutationError("Unable to evaluate publish readiness", "TEMPORARY_ERROR");
  }
  const readyMediaIds = new Set(
    z.array(mediaReadinessRowSchema)
      .parse(mediaResult.data ?? [])
      .filter((media) => media.status === "ready")
      .map((media) => media.id),
  );

  return {
    contentVersion: invitation.content_version,
    result: evaluatePublishReadinessSnapshot({
    couple: invitation.couple,
    events: events.map((event) => ({
      title: event.title,
      ...(event.starts_at ? { startsAt: event.starts_at } : {}),
      ...(event.timezone ? { timezone: event.timezone } : {}),
    })),
    theme: theme
      ? {
        isActive: theme.is_active && Boolean(themeTier?.is_active) && hasValidEntitlement,
        rendererKey: theme.renderer_key,
        rendererConfigValid: z.record(z.string(), z.unknown()).safeParse(theme.layout_config).success,
      }
      : null,
    knownRendererKeys: new Set(getKnownRendererKeys()),
    usage: {
      galleryItems: galleryItems.length,
      bankAccounts: invitation.bank_accounts.length,
      videoEmbeds: invitation.settings.videoEmbeds?.length ?? 0,
      backgroundAudio: invitation.settings.backgroundAudioMediaId !== undefined,
    },
    allowance: {
      galleryItems: allowance.gallery_limit,
      bankAccounts: allowance.bank_account_limit,
      videoEmbeds: allowance.video_limit,
      audioEnabled: allowance.audio_enabled,
    },
    referencedMediaIds,
    readyMediaIds,
    isPrivate: invitation.is_private,
    hasPinCredential: (credentialResult.count ?? 0) > 0,
    }),
  };
}

export async function evaluatePublishReadiness(
  userId: string,
  invitationId: string,
): Promise<PublishReadinessResult> {
  return (await evaluatePublishReadinessAtVersion(userId, invitationId)).result;
}
