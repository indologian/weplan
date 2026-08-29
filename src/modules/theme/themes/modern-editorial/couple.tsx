import type { SectionRendererProps } from "@/modules/theme/renderer";
import { Portrait } from "@/modules/theme/primitives/portrait";

export function Couple({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom;
  const bride = invitation.couple.bride;

  return (
    <section className="modern-editorial" style={{ background: "var(--me-bg)", textAlign: "center" }}>
      <p className="me-overline me-animate">Mempelai</p>
      <hr className="me-rule me-animate me-delay-1" style={{ marginBottom: "4rem" }} />
      
      <div className="me-couple-container">
        <div className="me-person me-animate me-delay-2">
          <div className="me-person-photo-wrapper">
            <Portrait invitation={invitation} mediaId={groom?.photoMediaId} name={groom?.name} variant="arch" />
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", margin: "1.5rem 0 0.5rem" }}>
            {groom?.name ?? ""}
          </h2>
          {groom?.parentNames && groom.parentNames.length > 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--me-muted)" }}>
              Putra dari<br/>{groom.parentNames.join(" & ")}
            </p>
          )}
        </div>
        
        <div className="me-animate flex items-center justify-center">
          <span style={{ fontFamily: "var(--me-font-display)", fontSize: "4rem", color: "var(--me-accent)", fontStyle: "italic", lineHeight: 1.3 }}>
            &
          </span>
        </div>
        
        <div className="me-person me-animate me-delay-2">
          <div className="me-person-photo-wrapper">
            <Portrait invitation={invitation} mediaId={bride?.photoMediaId} name={bride?.name} variant="arch" />
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", margin: "1.5rem 0 0.5rem" }}>
            {bride?.name ?? ""}
          </h2>
          {bride?.parentNames && bride.parentNames.length > 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--me-muted)" }}>
              Putri dari<br/>{bride.parentNames.join(" & ")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
