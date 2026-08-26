import type { SectionRendererProps } from "@/modules/theme/renderer";
import "./theme.css";

export function Cover({ invitation }: SectionRendererProps) {
  const groomName = invitation.couple.groom?.name ?? "";
  const brideName = invitation.couple.bride?.name ?? "";

  return (
    <section
      className="modern-editorial"
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "3rem 1.5rem",
        textAlign: "center",
        background: "var(--me-bg)",
      }}
    >
      <p className="me-overline">Undangan Pernikahan</p>
      <hr className="me-rule" style={{ marginBottom: "2rem" }} />
      <h1
        style={{
          fontFamily: "var(--me-font-display)",
          fontSize: "clamp(2rem, 8vw, 3.5rem)",
          fontWeight: 400,
          lineHeight: 1.1,
          margin: 0,
        }}
      >
        {groomName}
      </h1>
      <span
        style={{
          display: "block",
          fontFamily: "var(--me-font-display)",
          fontSize: "1.5rem",
          margin: "1rem 0",
          color: "var(--me-accent)",
        }}
      >
        &
      </span>
      <h1
        style={{
          fontFamily: "var(--me-font-display)",
          fontSize: "clamp(2rem, 8vw, 3.5rem)",
          fontWeight: 400,
          lineHeight: 1.1,
          margin: 0,
        }}
      >
        {brideName}
      </h1>
      <hr className="me-rule" style={{ marginTop: "2rem" }} />
    </section>
  );
}
