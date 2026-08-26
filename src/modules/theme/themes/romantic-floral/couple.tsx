import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Couple({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom;
  const bride = invitation.couple.bride;

  return (
    <section
      className="romantic-floral"
      style={{ background: "var(--rf-bg)", textAlign: "center" }}
    >
      <p className="rf-overline">Mempelai</p>
      <div className="rf-floral-divider">
        <span className="rf-floral-dot" />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "2rem",
          flexWrap: "wrap",
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        <div style={{ flex: "1 1 180px", minWidth: "150px" }}>
          <h2
            style={{
              fontFamily: "var(--rf-font-display)",
              fontSize: "clamp(1.5rem, 5vw, 2.25rem)",
              fontWeight: 400,
              margin: "0 0 0.5rem",
              color: "var(--rf-text)",
            }}
          >
            {groom?.name ?? ""}
          </h2>
          {groom?.parentNames && groom.parentNames.length > 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--rf-muted)", margin: 0 }}>
              Putra dari {groom.parentNames.join(" & ")}
            </p>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "0.5rem",
          }}
        >
          <span className="rf-ampersand" aria-hidden="true">&</span>
        </div>
        <div style={{ flex: "1 1 180px", minWidth: "150px" }}>
          <h2
            style={{
              fontFamily: "var(--rf-font-display)",
              fontSize: "clamp(1.5rem, 5vw, 2.25rem)",
              fontWeight: 400,
              margin: "0 0 0.5rem",
              color: "var(--rf-text)",
            }}
          >
            {bride?.name ?? ""}
          </h2>
          {bride?.parentNames && bride.parentNames.length > 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--rf-muted)", margin: 0 }}>
              Putri dari {bride.parentNames.join(" & ")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
