import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Closing({ invitation }: SectionRendererProps) {
  const groomName = invitation.couple.groom?.name ?? "";
  const brideName = invitation.couple.bride?.name ?? "";

  return (
    <section
      className="romantic-floral"
      style={{
        padding: "4rem 1.5rem",
        textAlign: "center",
        background: "var(--rf-bg)",
      }}
    >
      <div className="rf-floral-divider">
        <span className="rf-floral-dot" />
      </div>
      <p
        style={{
          fontFamily: "var(--rf-font-display)",
          fontSize: "1.125rem",
          fontStyle: "italic",
          color: "var(--rf-muted)",
          marginBottom: "1.5rem",
        }}
      >
        Terima kasih telah menjadi bagian dari hari bahagia kami.
      </p>
      <p
        style={{
          fontFamily: "var(--rf-font-display)",
          fontSize: "1.5rem",
          fontWeight: 400,
        }}
      >
        {groomName} & {brideName}
      </p>
    </section>
  );
}
