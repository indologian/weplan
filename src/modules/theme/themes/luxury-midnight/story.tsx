import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Story({ invitation }: SectionRendererProps) {
  if (invitation.loveStory.length === 0) return null;

  return (
    <section
      className="luxury-midnight"
      style={{ background: "var(--lm-bg)", textAlign: "center" }}
    >
      <p className="lm-overline">Cerita Cinta</p>
      <hr className="lm-gold-rule" style={{ marginBottom: "2rem" }} />
      {invitation.loveStory.map((item, index) => (
        <article
          key={item.id}
          style={{
            borderTop: index > 0 ? "1px solid var(--lm-border)" : "none",
            padding: "2rem 0",
          }}
        >
          {item.date && (
            <p
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "var(--lm-accent)",
                margin: "0 0 0.5rem",
              }}
            >
              {item.date}
            </p>
          )}
          {item.title && (
            <h3
              style={{
                fontFamily: "var(--lm-font-display)",
                fontSize: "1.25rem",
                fontWeight: 300,
                margin: "0 0 0.75rem",
                color: "var(--lm-text)",
                letterSpacing: "0.05em",
              }}
            >
              {item.title}
            </h3>
          )}
          {item.body && (
            <p style={{ maxWidth: "32ch", margin: "0 auto", lineHeight: 1.7, color: "var(--lm-text)" }}>
              {item.body}
            </p>
          )}
        </article>
      ))}
    </section>
  );
}
