import type { SectionRendererProps } from "@/modules/theme/renderer";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return iso;
  }
}

export function Story({ invitation }: SectionRendererProps) {
  const stories = invitation.loveStory;

  if (!stories || stories.length === 0) return null;

  return (
    <section className="luxury-midnight lm-story">
      <div style={{ textAlign: "center", marginBottom: "4rem" }} className="lm-story-header">
        <p className="lm-overline">Our Journey</p>
        <div className="lm-gold-rule" aria-hidden="true" />
      </div>

      <div className="lm-story-timeline">
        {stories.map((story, index) => {
          const photo = invitation.media.find(p => p.mediaId === story.photoMediaId);
          
          return (
            <article key={story.id} className="lm-story-chapter">
              <p className="lm-story-date">
                CHAPTER {String(index + 1).padStart(2, "0")} <span style={{ opacity: 0.5, margin: "0 0.5rem" }}>|</span> {formatDate(story.date)}
              </p>
              
              <h3 className="lm-story-title">{story.title}</h3>
              
              {photo && (
                <div className="lm-story-photo" style={{ margin: "1.5rem 0", height: "240px", overflow: "hidden" }}>
                  <img 
                    src={photo.url} 
                    alt={story.title} 
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${photo.focusX * 100}% ${photo.focusY * 100}%` }} 
                  />
                </div>
              )}
              
              <p style={{ color: "var(--lm-muted)", fontSize: "0.9375rem", lineHeight: 1.8 }}>
                {story.body}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}




