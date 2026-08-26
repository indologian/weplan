import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Story({ invitation }: SectionRendererProps) {
  if (invitation.loveStory.length === 0) return null;

  return (
    <section
      className="romantic-floral"
      style={{ background: "var(--rf-bg)", textAlign: "center" }}
    >
      <p className="rf-overline">Cerita Cinta</p>
      <div className="rf-floral-divider">
        <span className="rf-floral-dot" />
      </div>
      {invitation.loveStory.map((item, index) => (
        <article
          key={item.id}
          style={{
            borderTop: index > 0 ? "1px solid var(--rf-border)" : "none",
            padding: "2rem 0",
          }}
        >
          {item.date && (
            <p
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--rf-accent)",
                margin: "0 0 0.5rem",
              }}
            >
              {item.date}
            </p>
          )}
          {item.title && (
            <h3
              style={{
                fontFamily: "var(--rf-font-display)",
                fontSize: "1.25rem",
                fontWeight: 400,
                margin: "0 0 0.75rem",
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
