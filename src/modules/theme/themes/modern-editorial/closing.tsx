import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Closing({ invitation }: SectionRendererProps) {
  const groomName = invitation.couple.groom?.name ?? "";
  const brideName = invitation.couple.bride?.name ?? "";

  return (
    <section
      className="modern-editorial"
      style={{
        padding: "4rem 1.5rem",
        textAlign: "center",
        background: "var(--me-bg)",
      }}
    >
      <hr className="me-rule" style={{ marginBottom: "2rem" }} />
      <p
        style={{
          fontFamily: "var(--me-font-display)",
          fontSize: "1.125rem",
          fontStyle: "italic",
          color: "var(--me-muted)",
          marginBottom: "1.5rem",
        }}
      >
        Terima kasih telah menjadi bagian dari hari bahagia kami.
      </p>
      <p
        style={{
          fontFamily: "var(--me-font-display)",
          fontSize: "1.5rem",
          fontWeight: 400,
        }}
      >
        {groomName} & {brideName}
      </p>
    </section>
  );
}
