import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Couple({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom;
  const bride = invitation.couple.bride;

  const groomPhoto = invitation.media.find((m) => m.mediaId === groom?.photoMediaId)?.url;
  const bridePhoto = invitation.media.find((m) => m.mediaId === bride?.photoMediaId)?.url;

  return (
    <section
      className="modern-editorial"
      style={{ background: "var(--me-bg)", textAlign: "center" }}
    >
      <p className="me-overline">Mempelai</p>
      <hr className="me-rule" style={{ marginBottom: "3rem" }} />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "3rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {groomPhoto && (
            <img 
              src={groomPhoto} 
              alt={groom?.name}
              style={{ width: "160px", height: "160px", objectFit: "cover", borderRadius: "50%", marginBottom: "1.5rem", border: "1px solid var(--me-border)" }}
            />
          )}
          <h2
            style={{
              fontFamily: "var(--me-font-display)",
              fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
              fontWeight: 400,
              margin: "0 0 0.5rem",
            }}
          >
            {groom?.name ?? ""}
          </h2>
          {groom?.parentNames && groom.parentNames.length > 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--me-muted)" }}>
              {groom.parentNames.join(" & ")}
            </p>
          )}
        </div>
        <span
          style={{
            fontFamily: "var(--me-font-display)",
            fontSize: "2rem",
            color: "var(--me-accent)",
          }}
        >
          &
        </span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {bridePhoto && (
            <img 
              src={bridePhoto} 
              alt={bride?.name}
              style={{ width: "160px", height: "160px", objectFit: "cover", borderRadius: "50%", marginBottom: "1.5rem", border: "1px solid var(--me-border)" }}
            />
          )}
          <h2
            style={{
              fontFamily: "var(--me-font-display)",
              fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
              fontWeight: 400,
              margin: "0 0 0.5rem",
            }}
          >
            {bride?.name ?? ""}
          </h2>
          {bride?.parentNames && bride.parentNames.length > 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--me-muted)" }}>
              {bride.parentNames.join(" & ")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
