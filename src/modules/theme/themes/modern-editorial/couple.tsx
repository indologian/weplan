import type { SectionRendererProps } from "@/modules/theme/renderer";
import { Portrait } from "@/modules/theme/primitives/portrait";

export function Couple({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom;
  const bride = invitation.couple.bride;

  return (
    <section className="me-section me-couple" aria-labelledby="couple-title">
      <header className="me-section-heading me-reveal"><span>01</span><h2 id="couple-title">Mempelai</h2></header>
      <div className="me-couple-container">
        <article className="me-person me-person-groom me-reveal">
          <span className="me-person-index" aria-hidden="true">01</span>
          <div className="me-person-photo-wrapper">
            <Portrait invitation={invitation} mediaId={groom?.photoMediaId} name={groom?.name} variant="arch" />
          </div>
          <h3>{groom?.name ?? ""}</h3>
          {groom?.parentNames && groom.parentNames.length > 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--me-muted)" }}>
              Putra dari<br/>{groom.parentNames.join(" & ")}
            </p>
          )}
        </article>
        <span className="me-couple-and" aria-hidden="true">&amp;</span>
        <article className="me-person me-person-bride me-reveal">
          <span className="me-person-index" aria-hidden="true">02</span>
          <div className="me-person-photo-wrapper">
            <Portrait invitation={invitation} mediaId={bride?.photoMediaId} name={bride?.name} variant="arch" />
          </div>
          <h3>{bride?.name ?? ""}</h3>
          {bride?.parentNames && bride.parentNames.length > 0 && (
            <p style={{ fontSize: "0.875rem", color: "var(--me-muted)" }}>
              Putri dari<br/>{bride.parentNames.join(" & ")}
            </p>
          )}
        </article>
      </div>
    </section>
  );
}
