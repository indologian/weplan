import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Closing({ invitation }: SectionRendererProps) {
  const groomName = invitation.couple.groom?.name ?? "";
  const brideName = invitation.couple.bride?.name ?? "";

  return (
    <section
      className="javanese-heritage"
      style={{
        padding: "4rem 1.5rem",
        textAlign: "center",
        background: "var(--jh-bg)",
      }}
    >
      <hr className="jh-gold-rule" style={{ marginBottom: "2rem" }} />
      <p
        style={{
          fontFamily: "var(--jh-font-display)",
          fontSize: "1.125rem",
          fontStyle: "italic",
          color: "var(--jh-muted)",
          marginBottom: "1.5rem",
        }}
      >
        Terima kasih telah menjadi bagian dari hari bahagia kami.
      </p>
      <p
        style={{
          fontFamily: "var(--jh-font-display)",
          fontSize: "1.5rem",
          fontWeight: 700,
          letterSpacing: "0.05em",
        }}
      >
        {groomName} & {brideName}
      </p>
    </section>
  );
}
