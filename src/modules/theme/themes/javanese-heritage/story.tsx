import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Story({ invitation }: SectionRendererProps) {
  if (invitation.loveStory.length === 0) return null;

  return (
    <section
      className="javanese-heritage"
      style={{ background: "var(--jh-bg)", textAlign: "center" }}
    >
      <p className="jh-overline">Cerita Cinta</p>
      <hr className="jh-gold-rule" style={{ marginBottom: "2rem" }} />
      {invitation.loveStory.map((item, index) => (
        <article
          key={item.id}
          style={{
            borderTop: index > 0 ? "1px solid var(--jh-border)" : "none",
            padding: "2rem 0",
          }}
        >
          <div className="jh-chapter-rule" aria-hidden="true" />
          {item.date && (
            <p
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "var(--jh-accent)",
                margin: "0 0 0.5rem",
                fontWeight: 700,
              }}
            >
              {item.date}
            </p>
          )}
          {item.title && (
            <h3
              style={{
                fontFamily: "var(--jh-font-display)",
                fontSize: "1.25rem",
                fontWeight: 700,
                margin: "0 0 0.75rem",
                letterSpacing: "0.05em",
              }}
            >
              {item.title}
            </h3>
          )}
          {item.body && (
            <p style={{ maxWidth: "32ch", margin: "0 auto", lineHeight: 1.7 }}>
              {item.body}
            </p>
          )}
        </article>
      ))}
    </section>
  );
}
