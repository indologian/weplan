import type { PublicInvitationDTO } from "@/modules/invitation/types";
import { InvitationNavigation } from "./primitives/invitation-navigation";
import { InvitationShell } from "./primitives/invitation-shell";
import { RsvpForm } from "./primitives/rsvp-form";
import type { RendererProps } from "./types";

export type SectionRendererProps = { invitation: PublicInvitationDTO; guestName?: string };

export type ThemeSectionRenderers = {
  rootClassName: string;
  Cover: React.ComponentType<SectionRendererProps>;
  Events: React.ComponentType<SectionRendererProps>;
  Couple: React.ComponentType<SectionRendererProps>;
  Story: React.ComponentType<SectionRendererProps>;
  Gallery: React.ComponentType<SectionRendererProps>;
  Gift: React.ComponentType<SectionRendererProps>;
  Closing: React.ComponentType<SectionRendererProps>;
};

function isVisible(invitation: PublicInvitationDTO, key: string, fallback = true): boolean {
  return invitation.settings.sectionVisibility?.[key] ?? fallback;
}

function safeToken(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 100 || /url|expression|[;{}]/i.test(value)) return undefined;
  return value;
}

function getThemeStyle(invitation: PublicInvitationDTO): React.CSSProperties {
  const tokens = invitation.theme.designTokens;
  const layout = invitation.theme.layoutConfig;
  const style: Record<string, string> = {};
  const mappings: Array<[Record<string, unknown>, string, string]> = [
    [tokens, "background", "--theme-bg"], [tokens, "surface", "--theme-surface"],
    [tokens, "text", "--theme-text"], [tokens, "muted", "--theme-muted"],
    [tokens, "accent", "--theme-accent"], [tokens, "accentContrast", "--theme-accent-contrast"],
    [tokens, "border", "--theme-border"], [layout, "contentWidth", "--theme-content-width"],
    [layout, "sectionSpace", "--theme-section-space"], [layout, "cardRadius", "--theme-card-radius"],
    [layout, "photoRadius", "--theme-photo-radius"],
  ];
  for (const [source, key, variable] of mappings) {
    const value = safeToken(source[key]);
    if (value) style[variable] = value;
  }
  return style as React.CSSProperties;
}

import { VideoSection } from "./primitives/video-section";
import { Wishes } from "./primitives/wishes";
import { PhysicalGift } from "./primitives/physical-gift";

export function createRenderer(sections: ThemeSectionRenderers) {
  function ThemeRenderer({ invitation, guestName }: RendererProps) {
    const sectionProps = { invitation, guestName };
    const audioUrl = invitation.media.find((media) => media.mediaId === invitation.settings.backgroundAudioMediaId)?.url;
    const displayGuestName = invitation.guestName ?? guestName ?? "Tamu Kehormatan";
    const showStory = invitation.loveStory.some((item) => item.date || item.title || item.body) && isVisible(invitation, "loveStory");
    const showGallery = invitation.media.some((media) => media.purpose === "gallery") && isVisible(invitation, "gallery");
    const showVideo = (invitation.settings.videoEmbeds?.length ?? 0) > 0 && isVisible(invitation, "video");
    const showRsvp = invitation.rsvpMode === "open" && isVisible(invitation, "rsvp");
    const showWishes = invitation.wishes.length > 0 && isVisible(invitation, "guestbook");
    const showGift = (invitation.bankAccounts.length > 0 || invitation.settings.physicalGift?.enabled) && isVisible(invitation, "gift");
    const navigation = [
      { id: "couple", label: "Mempelai" },
      ...(invitation.events.length > 0 ? [{ id: "events", label: "Acara" }] : []),
      ...(showGallery ? [{ id: "gallery", label: "Galeri" }] : []),
      ...(showRsvp ? [{ id: "rsvp", label: "RSVP" }] : []),
      ...(showGift ? [{ id: "gift", label: "Hadiah" }] : []),
    ];

    return (
      <InvitationShell className={sections.rootClassName} guestName={displayGuestName} audioUrl={audioUrl} style={getThemeStyle(invitation)}>
        <div id="cover"><sections.Cover {...sectionProps} /></div>
        {(invitation.settings.openingText || invitation.settings.quoteText) && (
          <section className="theme-opening" aria-labelledby="opening-title">
            <p className="theme-overline">Dengan penuh sukacita</p>
            <h2 id="opening-title" className="sr-only">Pembuka</h2>
            {invitation.settings.openingText && <p>{invitation.settings.openingText}</p>}
            {invitation.settings.quoteText && <blockquote>{invitation.settings.quoteText}</blockquote>}
          </section>
        )}
        <div id="couple"><sections.Couple {...sectionProps} /></div>
        <div id="events"><sections.Events {...sectionProps} /></div>
        {showStory && <div id="story"><sections.Story {...sectionProps} /></div>}
        {showGallery && <div id="gallery"><sections.Gallery {...sectionProps} /></div>}
        {showVideo && <div id="video"><VideoSection invitation={invitation} /></div>}
        {showRsvp && <div id="rsvp"><RsvpForm invitationId={invitation.invitationId} guestName={invitation.guestName ?? guestName} className="theme-generic-section theme-rsvp" /></div>}
        {showWishes && <div id="wishes"><Wishes invitation={invitation} /></div>}
        {showGift && <div id="gift"><sections.Gift {...sectionProps} /><PhysicalGift invitation={invitation} /></div>}
        <sections.Closing {...sectionProps} />
        <InvitationNavigation items={navigation} />
      </InvitationShell>
    );
  }
  ThemeRenderer.displayName = `ThemeRenderer(${sections.rootClassName})`;
  return ThemeRenderer;
}
