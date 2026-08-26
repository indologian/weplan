import type { SectionRendererProps } from "@/modules/theme/renderer";
import "./theme.css";

export function Cover({ invitation }: SectionRendererProps) {
  const groomName = invitation.couple.groom?.name ?? "";
  const brideName = invitation.couple.bride?.name ?? "";

  return (
    <section
      className="luxury-midnight"
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "3rem 1.5rem",
        textAlign: "center",
        background: "var(--lm-bg)",
      }}
    >
      <p className="lm-overline">Undangan Pernikahan</p>
      <hr className="lm-gold-rule" style={{ marginBottom: "2rem" }} />
      <h1
        style={{
          fontFamily: "var(--lm-font-display)",
          fontSize: "clamp(2rem, 8vw, 3.5rem)",
          fontWeight: 300,
          lineHeight: 1.1,
          margin: 0,
          color: "var(--lm-text)",
          letterSpacing: "0.08em",
        }}
      >
        {groomName}
      </h1>
      <span
        style={{
          display: "block",
          fontFamily: "var(--lm-font-display)",
          fontSize: "1.5rem",
          margin: "1rem 0",
          color: "var(--lm-accent)",
          fontWeight: 300,
        }}
        aria-hidden="true"
      >
        &
      </span>
      <h1
        style={{
          fontFamily: "var(--lm-font-display)",
          fontSize: "clamp(2rem, 8vw, 3.5rem)",
          fontWeight: 300,
          lineHeight: 1.1,
          margin: 0,
          color: "var(--lm-text)",
          letterSpacing: "0.08em",
        }}
      >
        {brideName}
      </h1>
      <hr className="lm-gold-rule" style={{ marginTop: "2rem" }} />
    </section>
  );
}
