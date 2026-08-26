import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Couple({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom;
  const bride = invitation.couple.bride;

  return (
    <section
      className="javanese-heritage"
      style={{ background: "var(--jh-bg)", textAlign: "center" }}
    >
      <p className="jh-overline">Mempelai</p>
      <hr className="jh-gold-rule" style={{ marginBottom: "2rem" }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
          maxWidth: "400px",
          margin: "0 auto",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--jh-font-display)",
              fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
              fontWeight: 700,
              margin: "0 0 0.5rem",
              letterSpacing: "0.05em",
            }}
          >
            {groom?.name ?? ""}
          </h2>
          {groom?.parentNames && groom.parentNames.length > 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--jh-muted)", margin: 0 }}>
              Putra dari {groom.parentNames.join(" & ")}
            </p>
          )}
        </div>
        <span
          style={{
            fontFamily: "var(--jh-font-display)",
            fontSize: "1.5rem",
            color: "var(--jh-accent)",
            fontWeight: 700,
          }}
          aria-hidden="true"
        >
          &
        </span>
        <div>
          <h2
            style={{
              fontFamily: "var(--jh-font-display)",
              fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
              fontWeight: 700,
              margin: "0 0 0.5rem",
              letterSpacing: "0.05em",
            }}
          >
            {bride?.name ?? ""}
          </h2>
          {bride?.parentNames && bride.parentNames.length > 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--jh-muted)", margin: 0 }}>
              Putri dari {bride.parentNames.join(" & ")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
