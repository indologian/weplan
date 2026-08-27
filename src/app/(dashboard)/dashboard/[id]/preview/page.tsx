import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server-client";
import { WeddingRenderer } from "@/modules/theme/wedding-renderer";
import type { PublicInvitationDTO } from "@/modules/invitation/types";
import "@/modules/theme/init";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ theme?: string }>;
};

async function getOwnerInvitation(
  userId: string,
  invitationId: string,
): Promise<PublicInvitationDTO | null> {
  const supabase = await createSupabaseServerClient();

  const { data: invitation, error } = await supabase
    .from("invitations")
    .select(`
      id, slug, is_private, couple, love_story, bank_accounts, settings,
      theme_id, status, deleted_at,
      themes!inner ( renderer_key, design_tokens, layout_config )
    `)
    .eq("id", invitationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !invitation) return null;
  if (invitation.deleted_at) return null;
  if (invitation.status === "expired" || invitation.status === "trashed") return null;

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

export default async function PreviewPage({ params, searchParams }: Props) {
  const { id } = await params;
  const _searchParams = await searchParams;
  void _searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const invitation = await getOwnerInvitation(user.id, id);
  if (!invitation) {
    notFound();
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "480px",
        margin: "0 auto",
        minHeight: "100svh",
      }}
    >
      <WeddingRenderer invitation={invitation} />
    </div>
  );
}
