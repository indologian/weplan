import type { SectionRendererProps } from "@/modules/theme/renderer";
import { Portrait } from "@/modules/theme/primitives/portrait";

export function Couple({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom;
  const bride = invitation.couple.bride;

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
          <Portrait invitation={invitation} mediaId={groom?.photoMediaId} name={groom?.name} variant="circle" />
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
          <Portrait invitation={invitation} mediaId={bride?.photoMediaId} name={bride?.name} variant="circle" />
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
