import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Story({ invitation }: SectionRendererProps) {
  const validStories = invitation.loveStory.filter((item) => item.date || item.title || item.body);
  if (validStories.length === 0) return null;

  return (
    <section className="modern-editorial" style={{ background: "var(--me-surface)", textAlign: "center" }}>
      <p className="me-overline me-animate">Cerita Cinta</p>
      <hr className="me-rule me-animate me-delay-1" style={{ marginBottom: "2rem" }} />
      
      <div className="me-story-container">
        {validStories.map((item, index) => (
          <article
            key={item.id}
            className={`me-story-article me-animate me-delay-${(index % 3) + 1}`}
          >
            {item.date && (
              <p className="me-story-date">
                {item.date}
              </p>
            )}
            {item.title && (
              <h3 className="me-story-title">
                {item.title}
              </h3>
            )}
            {item.body && (
              <p className="me-story-body">
                {item.body}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
