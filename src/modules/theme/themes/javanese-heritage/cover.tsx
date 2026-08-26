import type { SectionRendererProps } from "@/modules/theme/renderer";
import "./theme.css";

export function Cover({ invitation }: SectionRendererProps) {
  const groomName = invitation.couple.groom?.name ?? "";
  const brideName = invitation.couple.bride?.name ?? "";

  return (
    <section
      className="javanese-heritage"
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "3rem 1.5rem",
        textAlign: "center",
        background: "var(--jh-bg)",
      }}
    >
      <p className="jh-overline">Undangan Pernikahan</p>
      <hr className="jh-gold-rule" style={{ marginBottom: "2rem" }} />
      <h1
        style={{
          fontFamily: "var(--jh-font-display)",
          fontSize: "clamp(2rem, 8vw, 3.5rem)",
          fontWeight: 700,
          lineHeight: 1.1,
          margin: 0,
          letterSpacing: "0.05em",
          color: "var(--jh-text)",
        }}
      >
        {groomName}
      </h1>
      <span
        style={{
          display: "block",
          fontFamily: "var(--jh-font-display)",
          fontSize: "1.5rem",
          margin: "1rem 0",
          color: "var(--jh-accent)",
          fontWeight: 700,
        }}
        aria-hidden="true"
      >
        &
      </span>
      <h1
        style={{
          fontFamily: "var(--jh-font-display)",
          fontSize: "clamp(2rem, 8vw, 3.5rem)",
          fontWeight: 700,
          lineHeight: 1.1,
          margin: 0,
          letterSpacing: "0.05em",
          color: "var(--jh-text)",
        }}
      >
        {brideName}
      </h1>
      <hr className="jh-gold-rule" style={{ marginTop: "2rem" }} />
    </section>
  );
}
