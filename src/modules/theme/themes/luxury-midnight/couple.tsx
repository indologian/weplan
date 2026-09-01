import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Couple({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom;
  const bride = invitation.couple.bride;
  
  const groomPhoto = invitation.media.find(p => p.mediaId === groom?.photoMediaId);
  const bridePhoto = invitation.media.find(p => p.mediaId === bride?.photoMediaId);

  return (
    <section className="luxury-midnight lm-couple-section">
      <div className="lm-couple">
        <div className="lm-person lm-groom-card">
          {groomPhoto ? (
            <div className="lm-person-photo">
              <img 
                src={groomPhoto.url} 
                alt={groom?.name ?? ""} 
                style={{ objectPosition: `${groomPhoto.focusX * 100}% ${groomPhoto.focusY * 100}%` }}
              />
            </div>
          ) : (
            <div className="lm-person-photo" style={{ backgroundColor: "var(--lm-surface)" }} />
          )}
          
          <div className="lm-person-info">
            <p className="lm-overline">The Groom</p>
            <h3>{groom?.name ?? ""}</h3>
            {groom?.parentNames && groom.parentNames.length > 0 && (
              <p className="lm-person-parent">
                {groom.parentNames.join(" & ")}
              </p>
            )}
          </div>
        </div>
        
        <div className="lm-person lm-bride-card">
          <div className="lm-person-info" style={{ order: 1 }}>
            <p className="lm-overline">The Bride</p>
            <h3>{bride?.name ?? ""}</h3>
            {bride?.parentNames && bride.parentNames.length > 0 && (
              <p className="lm-person-parent">
                {bride.parentNames.join(" & ")}
              </p>
            )}
          </div>
          
          {bridePhoto ? (
            <div className="lm-person-photo" style={{ order: 0, borderRadius: "0 0 100px 100px", borderTop: "none", borderBottom: "1px solid var(--lm-border)" }}>
              <img 
                src={bridePhoto.url} 
                alt={bride?.name ?? ""} 
                style={{ objectPosition: `${bridePhoto.focusX * 100}% ${bridePhoto.focusY * 100}%` }}
              />
            </div>
          ) : (
            <div className="lm-person-photo" style={{ order: 0, borderRadius: "0 0 100px 100px", borderTop: "none", borderBottom: "1px solid var(--lm-border)", backgroundColor: "var(--lm-surface)" }} />
          )}
        </div>
      </div>
    </section>
  );
}


