import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server-client";
import { WeddingRenderer } from "@/modules/theme/wedding-renderer";
import { WeddingCanvas } from "@/modules/theme/primitives/layout/wedding-canvas";
import type { PublicInvitationDTO } from "@/modules/invitation/types";
import { CheckoutButton } from "@/app/(dashboard)/dashboard/[id]/checkout-button";
import { Button } from "@/shared/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ theme?: string }>;
};

type OwnerPreview = {
  invitation: PublicInvitationDTO;
  status: string;
};

async function getOwnerInvitation(
  userId: string,
  invitationId: string,
): Promise<OwnerPreview | null> {
  const supabase = await createSupabaseServerClient();

  const { data: invitation, error } = await supabase
    .from("invitations")
    .select(`
      id, slug, is_private, rsvp_mode, couple, love_story, bank_accounts, settings,
      theme_id, status, deleted_at,
      themes!inner ( renderer_key, design_tokens, layout_config )
    `)
    .eq("id", invitationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !invitation) return null;
  if (invitation.deleted_at) return null;
  if (invitation.status === "expired" || invitation.status === "trashed") return null;

  const { data: events, error: eventsError } = await supabase
    .from("invitation_events")
    .select("id,position,event_type,title,starts_at,ends_at,timezone,venue_name,address,latitude,longitude")
    .eq("invitation_id", invitation.id)
    .order("position", { ascending: true });
  if (eventsError) {
    throw new Error("Unable to load preview events");
  }

  const themeRaw = invitation.themes as unknown as Record<string, unknown>;
  const theme = {
    rendererKey: themeRaw.renderer_key as string,
    designTokens: (themeRaw.design_tokens ?? {}) as Record<string, unknown>,
    layoutConfig: (themeRaw.layout_config ?? {}) as Record<string, unknown>,
  };
  const { data: galleryItems, error: galleryError } = await supabase.from("invitation_gallery_items")
    .select("media_asset_id,caption,position").eq("invitation_id", invitation.id).order("position");
  if (galleryError) {
    throw new Error("Unable to load preview gallery");
  }
  const referencedIds = new Set<string>([
    ...((galleryItems ?? []).map((item) => item.media_asset_id)),
    invitation.couple?.groom?.photoMediaId,
    invitation.couple?.bride?.photoMediaId,
    ...((invitation.love_story ?? []).map((item: PublicInvitationDTO["loveStory"][number]) => item.photoMediaId)),
    ...((invitation.bank_accounts ?? []).map((item: PublicInvitationDTO["bankAccounts"][number]) => item.qrisMediaId)),
    invitation.settings?.backgroundAudioMediaId,
  ].filter((value): value is string => typeof value === "string"));
  const { data: assets, error: assetsError } = referencedIds.size > 0
    ? await supabase.from("media_assets")
        .select("id,kind,purpose,width,height,focus_x,focus_y")
        .eq("invitation_id", invitation.id).eq("status", "ready").in("id", [...referencedIds])
    : { data: [], error: null };
  if (assetsError) {
    throw new Error("Unable to load preview media");
  }
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
  const { data: wishes, error: wishesError } = await supabase.from("guests")
    .select("name,wish_message,created_at").eq("invitation_id", invitation.id)
    .eq("wish_status", "approved").not("wish_message", "is", null)
    .order("created_at", { ascending: false }).limit(20);
  if (wishesError) {
    throw new Error("Unable to load preview wishes");
  }

  return {
    status: invitation.status,
    invitation: {
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
      wishes: (wishes ?? []).map((wish) => ({ name: wish.name, wishMessage: wish.wish_message ?? "", createdAt: wish.created_at })),
    },
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

  const preview = await getOwnerInvitation(user.id, id);
  if (!preview) {
    notFound();
  }

  const { invitation, status } = preview;

  return (
    <div className="relative min-h-svh pb-24">
      <WeddingCanvas>
        <WeddingRenderer invitation={invitation} />
      </WeddingCanvas>

      <div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] border-t bg-background/95 px-4 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex w-full gap-3">
          <Button asChild variant="outline" className="flex-1 h-12 text-base font-medium">
            <Link href={`/dashboard/${invitation.invitationId}/edit`}>Kembali Edit</Link>
          </Button>

          {status === "published" ? (
            <Button asChild className="flex-1 h-12 text-base font-medium">
              <Link href={`/${invitation.slug}`}>Buka Halaman Publik</Link>
            </Button>
          ) : (
            <CheckoutButton
              invitationId={invitation.invitationId}
              flushEditorBeforeCheckout={false}
              className="flex-1 h-12 text-base font-medium"
            />
          )}
        </div>
      </div>
    </div>
  );
}
