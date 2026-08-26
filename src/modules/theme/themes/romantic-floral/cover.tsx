import type { SectionRendererProps } from "@/modules/theme/renderer";
import "./theme.css";

export function Cover({ invitation }: SectionRendererProps) {
  const groomName = invitation.couple.groom?.name ?? "";
  const brideName = invitation.couple.bride?.name ?? "";

  return (
    <section
      className="romantic-floral"
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "3rem 1.5rem",
        textAlign: "center",
        background: "var(--rf-bg)",
      }}
    >
      <p className="rf-overline">Undangan Pernikahan</p>
      <div className="rf-rose-ornament" />
      <h1
        style={{
          fontFamily: "var(--rf-font-display)",
          fontSize: "clamp(2rem, 8vw, 3.5rem)",
          fontWeight: 400,
          lineHeight: 1.1,
          margin: 0,
          color: "var(--rf-text)",
        }}
      >
        {groomName}
      </h1>
      <span
        style={{
          display: "block",
          fontFamily: "var(--rf-font-display)",
          fontSize: "2.5rem",
          margin: "0.75rem 0",
          color: "var(--rf-accent)",
          fontStyle: "italic",
        }}
        aria-hidden="true"
      >
        &
      </span>
      <h1
        style={{
          fontFamily: "var(--rf-font-display)",
          fontSize: "clamp(2rem, 8vw, 3.5rem)",
          fontWeight: 400,
          lineHeight: 1.1,
          margin: 0,
          color: "var(--rf-text)",
        }}
      >
        {brideName}
      </h1>
      <div className="rf-rose-ornament" />
    </section>
  );
}
