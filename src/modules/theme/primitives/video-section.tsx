import type { PublicInvitationDTO } from "@/modules/invitation/types";

export function VideoSection({ invitation }: { invitation: PublicInvitationDTO }) {
  const embeds = invitation.settings.videoEmbeds ?? [];
  if (embeds.length === 0) return null;
  
  return (
    <section className="theme-generic-section" aria-labelledby="video-title">
      <p className="theme-overline">Siaran & Video</p>
      <h2 id="video-title">Saksikan Momen Kami</h2>
      <div className="theme-video-list">
        {embeds.map((embed) => (
          <div key={embed.id} className="theme-video-frame">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${embed.externalId}`}
              title={embed.title ?? (embed.kind === "live" ? "Siaran langsung pernikahan" : "Video pernikahan")}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ))}
      </div>
    </section>
  );
}
