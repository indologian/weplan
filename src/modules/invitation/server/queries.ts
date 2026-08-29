import "server-only";

import { z } from "zod";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import {
  bankAccountItemSchema,
  invitationCoupleSchema,
  invitationSettingsSchema,
  loveStoryItemSchema,
} from "../schemas";
import type { EditorDTO } from "../types";
import { EditorMutationError } from "./repository";

const editorInvitationSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  status: z.enum(["draft", "published", "expired", "trashed"]),
  is_private: z.boolean(),
  rsvp_mode: z.enum(["personal_only", "open"]),
  guestbook_moderation: z.enum(["auto", "manual"]),
  couple: invitationCoupleSchema,
  love_story: z.array(loveStoryItemSchema),
  bank_accounts: z.array(bankAccountItemSchema),
  settings: invitationSettingsSchema,
  content_version: z.number().int().positive(),
  expires_at: z.string().nullable(),
  theme_id: z.uuid(),
}).strict();

const editorEventSchema = z.object({
  id: z.uuid(),
  position: z.number().int().min(0),
  event_type: z.string(),
  title: z.string(),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  timezone: z.string().nullable(),
  venue_name: z.string(),
  address: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
}).strict();

const editorGalleryItemSchema = z.object({
  id: z.uuid(),
  media_asset_id: z.uuid(),
  position: z.number().int().min(0),
  caption: z.string().nullable(),
}).strict();

export async function getEditorDTO(userId: string, invitationId: string): Promise<EditorDTO | null> {
  const supabase = createSupabaseServiceClient();
  const { data: rawInvitation, error: invitationError } = await supabase
    .from("invitations")
    .select("id,slug,status,is_private,rsvp_mode,guestbook_moderation,couple,love_story,bank_accounts,settings,content_version,expires_at,theme_id")
    .eq("id", invitationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (invitationError) throw new EditorMutationError("Unable to load editor", "TEMPORARY_ERROR");
  if (!rawInvitation) return null;

  const invitation = editorInvitationSchema.parse(rawInvitation);
  const [eventsResult, galleryResult] = await Promise.all([
    supabase
      .from("invitation_events")
      .select("id,position,event_type,title,starts_at,ends_at,timezone,venue_name,address,latitude,longitude")
      .eq("invitation_id", invitationId)
      .order("position", { ascending: true }),
    supabase
      .from("invitation_gallery_items")
      .select("id,media_asset_id,position,caption")
      .eq("invitation_id", invitationId)
      .order("position", { ascending: true }),
  ]);

  if (eventsResult.error || galleryResult.error) {
    throw new EditorMutationError("Unable to load editor relations", "TEMPORARY_ERROR");
  }
  const events = z.array(editorEventSchema).parse(eventsResult.data ?? []);
  const gallery = z.array(editorGalleryItemSchema).parse(galleryResult.data ?? []);

  return {
    invitationId: invitation.id,
    slug: invitation.slug,
    status: invitation.status,
    isPrivate: invitation.is_private,
    rsvpMode: invitation.rsvp_mode,
    guestbookModeration: invitation.guestbook_moderation,
    couple: invitation.couple,
    loveStory: invitation.love_story,
    bankAccounts: invitation.bank_accounts,
    settings: invitation.settings,
    contentVersion: invitation.content_version,
    expiresAt: invitation.expires_at,
    themeId: invitation.theme_id,
    events: events.map((event) => ({
      eventId: event.id,
      position: event.position,
      eventType: event.event_type,
      title: event.title,
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      timezone: event.timezone,
      venueName: event.venue_name,
      address: event.address,
      latitude: event.latitude,
      longitude: event.longitude,
    })),
    gallery: gallery.map((item) => ({
      galleryItemId: item.id,
      mediaAssetId: item.media_asset_id,
      position: item.position,
      ...(item.caption ? { caption: item.caption } : {}),
    })),
  };
}
