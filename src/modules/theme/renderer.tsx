import type { RendererProps } from "./types";
import type { PublicInvitationDTO } from "@/modules/invitation/types";

export type SectionRendererProps = {
  invitation: PublicInvitationDTO;
  guestName?: string;
};

export type ThemeSectionRenderers = {
  Cover: React.ComponentType<SectionRendererProps>;
  Events: React.ComponentType<SectionRendererProps>;
  Couple: React.ComponentType<SectionRendererProps>;
  Story: React.ComponentType<SectionRendererProps>;
  Gallery: React.ComponentType<SectionRendererProps>;
  Gift: React.ComponentType<SectionRendererProps>;
  Closing: React.ComponentType<SectionRendererProps>;
  Music?: React.ComponentType<SectionRendererProps>;
};

export function createRenderer(sections: ThemeSectionRenderers) {
  function ThemeRenderer({ invitation, guestName }: RendererProps) {
    const sectionProps: SectionRendererProps = { invitation, guestName };

    return (
      <main style={{ minHeight: "100svh" }}>
        <sections.Cover {...sectionProps} />
        {invitation.settings.openingText && (
          <section aria-label="Pembuka">
            <p>{invitation.settings.openingText}</p>
            {invitation.settings.quoteText && (
              <blockquote>{invitation.settings.quoteText}</blockquote>
            )}
          </section>
        )}
        <sections.Couple {...sectionProps} />
        <sections.Events {...sectionProps} />
        {invitation.loveStory.length > 0 && (
          <sections.Story {...sectionProps} />
        )}
        <sections.Gallery {...sectionProps} />
        <sections.Gift {...sectionProps} />
        {sections.Music && invitation.settings.backgroundAudioMediaId && (
          <sections.Music {...sectionProps} />
        )}
        <sections.Closing {...sectionProps} />
      </main>
    );
  }

  ThemeRenderer.displayName = "ThemeRenderer";
  return ThemeRenderer;
}
