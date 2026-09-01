import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Story({ invitation }: SectionRendererProps) {
  const validStories = invitation.loveStory.filter((item) => item.date || item.title || item.body);
  if (validStories.length === 0) return null;

  return (
    <section className="me-section me-story" aria-labelledby="story-title">
      <header className="me-story-header me-reveal"><span>02 / Feature</span><h2 id="story-title">Catatan perjalanan kami.</h2></header>
      <div className="me-story-container">
        {validStories.map((item, index) => (
          <article
            key={item.id}
            className="me-story-article me-reveal"
          >
            <span className="me-story-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
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
