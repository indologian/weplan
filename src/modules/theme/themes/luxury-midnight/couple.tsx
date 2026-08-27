import type { SectionRendererProps } from "@/modules/theme/renderer";
import { Portrait } from "@/modules/theme/primitives/portrait";

export function Couple({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom;
  const bride = invitation.couple.bride;

  return (
    <section
      className="luxury-midnight"
      style={{ background: "var(--lm-bg)", textAlign: "center" }}
    >
      <p className="lm-overline">Mempelai</p>
      <hr className="lm-gold-rule" style={{ marginBottom: "2rem" }} />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "3rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <Portrait invitation={invitation} mediaId={groom?.photoMediaId} name={groom?.name} variant="oval" />
          <h2
            style={{
              fontFamily: "var(--lm-font-display)",
              fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
              fontWeight: 300,
              margin: "0 0 0.5rem",
              color: "var(--lm-text)",
              letterSpacing: "0.08em",
            }}
          >
            {groom?.name ?? ""}
          </h2>
          {groom?.parentNames && groom.parentNames.length > 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--lm-muted)" }}>
              {groom.parentNames.join(" & ")}
            </p>
          )}
        </div>
        <span
          style={{
            fontFamily: "var(--lm-font-display)",
            fontSize: "2rem",
            color: "var(--lm-accent)",
            fontWeight: 300,
          }}
          aria-hidden="true"
        >
          &
        </span>
        <div>
          <Portrait invitation={invitation} mediaId={bride?.photoMediaId} name={bride?.name} variant="oval" />
          <h2
            style={{
              fontFamily: "var(--lm-font-display)",
              fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
              fontWeight: 300,
              margin: "0 0 0.5rem",
              color: "var(--lm-text)",
              letterSpacing: "0.08em",
            }}
          >
            {bride?.name ?? ""}
          </h2>
          {bride?.parentNames && bride.parentNames.length > 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--lm-muted)" }}>
              {bride.parentNames.join(" & ")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
