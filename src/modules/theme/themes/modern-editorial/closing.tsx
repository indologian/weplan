import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Closing({ invitation }: SectionRendererProps) {
  const groomName = invitation.couple.groom?.name ?? "";
  const brideName = invitation.couple.bride?.name ?? "";

  return (
    <section
      className="modern-editorial"
      style={{
        padding: "6rem 1.5rem",
        textAlign: "center",
        background: "var(--me-bg)",
      }}
    >
      <hr className="me-rule me-animate" style={{ marginBottom: "2rem" }} />
      <p
        className="me-animate me-delay-1"
        style={{
          fontFamily: "var(--me-font-display)",
          fontSize: "1.25rem",
          fontStyle: "italic",
          color: "var(--me-muted)",
          marginBottom: "1.5rem",
        }}
      >
        Terima kasih telah menjadi bagian dari hari bahagia kami.
      </p>
      <p
        className="me-animate me-delay-2"
        style={{
          fontFamily: "var(--me-font-display)",
          fontSize: "2rem",
          fontWeight: 400,
        }}
      >
        {groomName} & {brideName}
      </p>
    </section>
  );
}
