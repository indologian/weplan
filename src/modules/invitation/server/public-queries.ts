import "server-only";

import { z } from "zod";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import type { PublicInvitationDTO, PublicEventDTO, PublicMediaDTO } from "@/modules/theme/types";

const publicEventSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int(),
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

export class PublicInvitationError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "EXPIRED" | "PRIVATE" | "SUSPENDED" | "DATABASE_ERROR",
  ) {
    super(message);
    this.name = "PublicInvitationError";
  }
}

export async function getPublicInvitation(slug: string): Promise<PublicInvitationDTO> {
  const supabase = createSupabaseServiceClient();

  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select(`
      id, slug, is_private, couple, love_story, bank_accounts, settings,
      theme_id, published_at, expires_at, public_suspended_at,
      themes!inner ( renderer_key, design_tokens, layout_config )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (invitationError) {
    throw new PublicInvitationError("Database error", "DATABASE_ERROR");
  }

  if (!invitation) {
    throw new PublicInvitationError("Invitation not found", "NOT_FOUND");
  }

  if (invitation.public_suspended_at) {
    throw new PublicInvitationError("Invitation suspended", "SUSPENDED");
  }

  if (invitation.expires_at && new Date(invitation.expires_at) <= new Date()) {
    throw new PublicInvitationError("Invitation expired", "EXPIRED");
  }

  if (invitation.is_private) {
    throw new PublicInvitationError("Invitation is private", "PRIVATE");
  }

  const { data: events, error: eventsError } = await supabase
    .from("invitation_events")
    .select("id,position,event_type,title,starts_at,ends_at,timezone,venue_name,address,latitude,longitude")
    .eq("invitation_id", invitation.id)
    .order("position", { ascending: true });

  if (eventsError) {
    throw new PublicInvitationError("Database error loading events", "DATABASE_ERROR");
  }

  const parsedEvents: PublicEventDTO[] = (events ?? []).map((event) => {
    const parsed = publicEventSchema.parse(event);
    return {
      eventId: parsed.id,
      position: parsed.position,
      eventType: parsed.event_type,
      title: parsed.title,
      startsAt: parsed.starts_at,
      endsAt: parsed.ends_at,
      timezone: parsed.timezone,
      venueName: parsed.venue_name,
      address: parsed.address,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
    };
  });

  const themeRaw = (invitation.themes as unknown as Record<string, unknown>);
  const theme = {
    rendererKey: themeRaw.renderer_key as string,
    designTokens: (themeRaw.design_tokens ?? {}) as Record<string, unknown>,
    layoutConfig: (themeRaw.layout_config ?? {}) as Record<string, unknown>,
  };

  const { data: galleryItems } = await supabase
    .from("invitation_gallery_items")
    .select(`
      id, media_asset_id, caption, position,
      media_assets!inner ( id, status, final_path, kind, purpose )
    `)
    .eq("invitation_id", invitation.id)
    .order("position", { ascending: true });

  const media: PublicMediaDTO[] = (galleryItems ?? [])
    .filter((item) => {
      const asset = item.media_assets as unknown as Record<string, unknown>;
      return asset.status === "ready" && asset.final_path;
    })
    .map((item) => {
      const asset = item.media_assets as unknown as Record<string, unknown>;
      return {
        mediaId: asset.id as string,
        purpose: asset.purpose as string,
        variant: "original",
        url: `/api/media/${asset.id}/original`,
      };
    });

  return {
    invitationId: invitation.id,
    slug: invitation.slug,
    isPrivate: invitation.is_private,
    couple: invitation.couple,
    loveStory: invitation.love_story,
    bankAccounts: invitation.bank_accounts,
    settings: invitation.settings,
    events: parsedEvents,
    theme: {
      rendererKey: theme.rendererKey,
      designTokens: theme.designTokens,
      layoutConfig: theme.layoutConfig,
    },
    media,
  };
}
