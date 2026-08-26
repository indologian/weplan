import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Story({ invitation }: SectionRendererProps) {
  if (invitation.loveStory.length === 0) return null;

  return (
    <section style={{ padding: "2rem" }}>
      <h2>Cerita Cinta</h2>
      {invitation.loveStory.map((item) => (
        <article key={item.id} style={{ marginTop: "1.5rem" }}>
          {item.date && (
            <p style={{ fontSize: "0.875rem", opacity: 0.7 }}>{item.date}</p>
          )}
          {item.title && <h3>{item.title}</h3>}
          {item.body && <p>{item.body}</p>}
        </article>
      ))}
    </section>
  );
}
