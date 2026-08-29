import { notFound } from "next/navigation";
import { getPublicInvitation } from "@/modules/invitation/server/public-queries";
import type { PublicInvitationDTO } from "@/modules/invitation/types";
import { WeddingRenderer } from "@/modules/theme/wedding-renderer";
import { PinGate } from "@/modules/guest/components/pin-gate";
import { verifyPrivateSessionFromCookie, resolveGuestFromToken } from "@/modules/guest/server/pin-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ guest?: string }>;
};

async function getPrivateInvitation(slug: string): Promise<PublicInvitationDTO | null> {
  const { createSupabaseServiceClient } = await import("@/shared/lib/supabase/service-client");
  const supabase = createSupabaseServiceClient();

  const { data: invitation } = await supabase
    .from("invitations")
    .select(`
      id, slug, is_private, rsvp_mode, couple, love_story, bank_accounts, settings,
      theme_id, published_at, expires_at, public_suspended_at, pin_version,
      themes!inner ( renderer_key, design_tokens, layout_config )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (!invitation) return null;
  if (invitation.public_suspended_at) return null;
  if (invitation.expires_at && new Date(invitation.expires_at) <= new Date()) return null;
  if (!invitation.is_private) return null;

  const { data: events } = await supabase
    .from("invitation_events")
    .select("id,position,event_type,title,starts_at,ends_at,timezone,venue_name,address,latitude,longitude")
    .eq("invitation_id", invitation.id)
    .order("position", { ascending: true });

  const themeRaw = invitation.themes as unknown as Record<string, unknown>;
  const theme = {
    rendererKey: themeRaw.renderer_key as string,
    designTokens: (themeRaw.design_tokens ?? {}) as Record<string, unknown>,
    layoutConfig: (themeRaw.layout_config ?? {}) as Record<string, unknown>,
  };

  const referencedIds = new Set<string>([
    invitation.couple?.groom?.photoMediaId,
    invitation.couple?.bride?.photoMediaId,
    ...((invitation.love_story ?? []).map((item: PublicInvitationDTO["loveStory"][number]) => item.photoMediaId)),
    ...((invitation.bank_accounts ?? []).map((item: PublicInvitationDTO["bankAccounts"][number]) => item.qrisMediaId)),
    invitation.settings?.backgroundAudioMediaId,
  ].filter((value): value is string => typeof value === "string"));
  const { data: galleryItems } = await supabase
    .from("invitation_gallery_items")
    .select("media_asset_id,caption,position")
    .eq("invitation_id", invitation.id)
    .order("position", { ascending: true });
  for (const item of galleryItems ?? []) referencedIds.add(item.media_asset_id);
  const { data: assets } = referencedIds.size > 0
    ? await supabase.from("media_assets")
        .select("id,kind,purpose,width,height,focus_x,focus_y")
        .eq("invitation_id", invitation.id).eq("status", "ready").in("id", [...referencedIds])
    : { data: [] };
  const galleryMetadata = new Map((galleryItems ?? []).map((item) => [item.media_asset_id, item]));
  const media = (assets ?? []).map((asset) => {
    const variant = asset.kind === "image" ? "medium" : "original";
    return {
      mediaId: asset.id, purpose: asset.purpose, variant,
      url: `/api/media/${asset.id}/${variant}`,
      width: asset.width, height: asset.height,
      focusX: Number(asset.focus_x), focusY: Number(asset.focus_y),
      caption: galleryMetadata.get(asset.id)?.caption ?? undefined,
    };
  });
  const { data: wishes } = await supabase.from("guests")
    .select("name,wish_message,created_at")
    .eq("invitation_id", invitation.id).eq("wish_status", "approved")
    .not("wish_message", "is", null).order("created_at", { ascending: false }).limit(20);

  return {
    invitationId: invitation.id,
    slug: invitation.slug,
    isPrivate: invitation.is_private,
    rsvpMode: invitation.rsvp_mode,
    couple: invitation.couple,
    loveStory: invitation.love_story,
    bankAccounts: invitation.bank_accounts,
    settings: invitation.settings,
    events: (events ?? []).map((e) => ({
      eventId: e.id,
      position: e.position,
      eventType: e.event_type,
      title: e.title,
      startsAt: e.starts_at,
      endsAt: e.ends_at,
      timezone: e.timezone,
      venueName: e.venue_name,
      address: e.address,
      latitude: e.latitude,
      longitude: e.longitude,
    })),
    theme: {
      rendererKey: theme.rendererKey,
      designTokens: theme.designTokens,
      layoutConfig: theme.layoutConfig,
    },
    media,
    wishes: (wishes ?? []).map((wish) => ({
      name: wish.name,
      wishMessage: wish.wish_message ?? "",
      createdAt: wish.created_at,
    })),
  };
}

export default async function WeddingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { guest: guestToken } = await searchParams;

  const publicInvitation = await getPublicInvitation(slug).catch(() => null);

  if (publicInvitation) {
    let guestName: string | undefined;
    if (guestToken) {
      const resolved = await resolveGuestFromToken(publicInvitation.invitationId, guestToken).catch(() => null);
      guestName = resolved?.name;
    }
    return (
      <div style={{ width: "100%", maxWidth: "480px", margin: "0 auto" }}>
        <WeddingRenderer invitation={publicInvitation} guestName={guestName} />
      </div>
    );
  }

  const privateInvitation = await getPrivateInvitation(slug);
  if (privateInvitation) {
    const hasValidSession = await verifyPrivateSessionFromCookie(privateInvitation.invitationId);
    if (hasValidSession) {
      let guestName: string | undefined;
      if (guestToken) {
        const resolved = await resolveGuestFromToken(privateInvitation.invitationId, guestToken).catch(() => null);
        guestName = resolved?.name;
      }
      return (
        <div style={{ width: "100%", maxWidth: "480px", margin: "0 auto" }}>
          <WeddingRenderer invitation={privateInvitation} guestName={guestName} />
        </div>
      );
    }
  }

  const slugInvitation = privateInvitation;
  if (!slugInvitation) notFound();

  return (
    <div style={{ width: "100%", maxWidth: "480px", margin: "0 auto" }}>
      <PinGate invitationId={slugInvitation.invitationId} slug={slug} />
    </div>
  );
}
