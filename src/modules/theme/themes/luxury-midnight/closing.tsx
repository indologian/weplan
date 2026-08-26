import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Closing({ invitation }: SectionRendererProps) {
  const groomName = invitation.couple.groom?.name ?? "";
  const brideName = invitation.couple.bride?.name ?? "";

  return (
    <section
      className="luxury-midnight"
      style={{
        padding: "4rem 1.5rem",
        textAlign: "center",
        background: "var(--lm-bg)",
      }}
    >
      <hr className="lm-gold-rule" style={{ marginBottom: "2rem" }} />
      <p
        style={{
          fontFamily: "var(--lm-font-display)",
          fontSize: "1.125rem",
          fontStyle: "italic",
          color: "var(--lm-muted)",
          marginBottom: "1.5rem",
        }}
      >
        Terima kasih telah menjadi bagian dari hari bahagia kami.
      </p>
      <p
        style={{
          fontFamily: "var(--lm-font-display)",
          fontSize: "1.5rem",
          fontWeight: 300,
          letterSpacing: "0.08em",
        }}
      >
        {groomName} & {brideName}
      </p>
    </section>
  );
}
