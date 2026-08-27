import { notFound } from "next/navigation";
import "@/modules/theme/init";
import { getPublicInvitation } from "@/modules/invitation/server/public-queries";
import type { PublicInvitationDTO } from "@/modules/theme/types";
import { BaselineRenderer } from "@/modules/theme/themes/_baseline/renderer";
import { ModernEditorialRenderer } from "@/modules/theme/themes/modern-editorial/renderer";
import { RomanticFloralRenderer } from "@/modules/theme/themes/romantic-floral/renderer";
import { JavaneseHeritageRenderer } from "@/modules/theme/themes/javanese-heritage/renderer";
import { LuxuryMidnightRenderer } from "@/modules/theme/themes/luxury-midnight/renderer";
import { PinGate } from "@/modules/guest/components/pin-gate";
import { verifyPrivateSessionFromCookie, resolveGuestFromToken } from "@/modules/guest/server/pin-session";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ guest?: string }>;
};

function renderInvitation(invitation: PublicInvitationDTO, guestName?: string) {
  switch (invitation.theme.rendererKey) {
    case "_baseline":
      return <BaselineRenderer invitation={invitation} guestName={guestName} />;
    case "modern-editorial-ivory":
      return <ModernEditorialRenderer invitation={invitation} guestName={guestName} />;
    case "romantic-floral-watercolor":
      return <RomanticFloralRenderer invitation={invitation} guestName={guestName} />;
    case "javanese-heritage":
      return <JavaneseHeritageRenderer invitation={invitation} guestName={guestName} />;
    case "luxury-midnight":
      return <LuxuryMidnightRenderer invitation={invitation} guestName={guestName} />;
    default:
      return null;
  }
}

async function getPrivateInvitation(slug: string): Promise<PublicInvitationDTO | null> {
  const { createSupabaseServiceClient } = await import("@/shared/lib/supabase/service-client");
  const supabase = createSupabaseServiceClient();

  const { data: invitation } = await supabase
    .from("invitations")
    .select(`
      id, slug, is_private, couple, love_story, bank_accounts, settings,
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

  return {
    invitationId: invitation.id,
    slug: invitation.slug,
    isPrivate: invitation.is_private,
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
    media: [],
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
    const content = renderInvitation(publicInvitation, guestName);
    if (!content) notFound();
    return (
      <div style={{ width: "100%", maxWidth: "480px", margin: "0 auto" }}>
        {content}
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
      const content = renderInvitation(privateInvitation, guestName);
      if (!content) notFound();
      return (
        <div style={{ width: "100%", maxWidth: "480px", margin: "0 auto" }}>
          {content}
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
