import { useState, useEffect } from "react";
import type { RendererProps } from "./types";
import type { PublicInvitationDTO } from "@/modules/invitation/types";
import { MailOpen } from "lucide-react";
import { MusicController } from "./primitives/music-controller";

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
};

export function createRenderer(sections: ThemeSectionRenderers) {
  function ThemeRenderer({ invitation, guestName }: RendererProps) {
    const [isOpen, setIsOpen] = useState(false);
    const sectionProps: SectionRendererProps = { invitation, guestName };
    const audioUrl = invitation.media.find((m) => m.mediaId === invitation.settings.backgroundAudioMediaId)?.url;


    // Kunci scroll body saat undangan belum dibuka
    useEffect(() => {
      if (!isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
      return () => {
        document.body.style.overflow = "unset";
      };
    }, [isOpen]);

    return (
      <main style={{ minHeight: "100svh", position: "relative" }}>
        {/* Overlay Buka Undangan (Envelope) */}
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md transition-all duration-700 ease-in-out"
          style={{
            opacity: isOpen ? 0 : 1,
            pointerEvents: isOpen ? "none" : "auto",
            transform: isOpen ? "translateY(-100%)" : "translateY(0)"
          }}
        >
          <div className="text-center space-y-6 px-6 max-w-sm animate-in fade-in zoom-in duration-700">
            <h2 className="text-2xl font-semibold tracking-tight">Undangan Pernikahan</h2>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground uppercase tracking-widest">Kepada Yth.</p>
              <p className="text-xl font-medium">{invitation.guestName || guestName || "Tamu Kehormatan"}</p>
            </div>
            <button 
              onClick={() => {
                setIsOpen(true);
                // Sinkron memutar musik tepat saat user berinteraksi
                const audio = document.getElementById("wedding-audio") as HTMLAudioElement;
                if (audio) {
                  audio.play().catch((e) => console.warn("Autoplay ditolak:", e));
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-full font-medium transition-transform hover:scale-105 active:scale-95"
            >
              <MailOpen className="w-4 h-4" />
              Buka Undangan
            </button>
          </div>
        </div>

        {/* Konten Utama Undangan */}
        <div style={{ opacity: isOpen ? 1 : 0, transition: "opacity 1s ease-in-out 0.3s" }}>
          <sections.Cover {...sectionProps} />
          {invitation.settings.openingText && (
            <section aria-label="Pembuka" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
              <p style={{ maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>{invitation.settings.openingText}</p>
              {invitation.settings.quoteText && (
                <blockquote style={{ marginTop: "1.5rem", fontStyle: "italic", opacity: 0.8 }}>
                  "{invitation.settings.quoteText}"
                </blockquote>
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
          <sections.Closing {...sectionProps} />
        </div>

        {/* Global Floating Music Player */}
        {audioUrl && (
          <div 
            className="fixed bottom-6 right-6 z-40 transition-all duration-700 ease-in-out"
            style={{ 
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? "scale(1)" : "scale(0.8)",
              pointerEvents: isOpen ? "auto" : "none" 
            }}
          >
            <MusicController 
              src={audioUrl} 
              autoPlay={isOpen}
              className="flex items-center justify-center w-12 h-12 bg-foreground text-background rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform" 
            />
          </div>
        )}
      </main>
    );
  }

  ThemeRenderer.displayName = "ThemeRenderer";
  return ThemeRenderer;
}
