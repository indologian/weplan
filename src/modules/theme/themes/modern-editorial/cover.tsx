import type { SectionRendererProps } from "@/modules/theme/renderer";
import "./theme.css";

export function Cover({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom?.name ?? "";
  const bride = invitation.couple.bride?.name ?? "";
  const image = invitation.media.find((item) => item.purpose === "gallery")
    ?? invitation.media.find((item) => item.mediaId === invitation.couple.groom?.photoMediaId)
    ?? invitation.media.find((item) => item.mediaId === invitation.couple.bride?.photoMediaId);
  const firstEvent = invitation.events.find((event) => event.startsAt);
  const date = firstEvent?.startsAt ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric", timeZone: firstEvent.timezone ?? "Asia/Jakarta" }).format(new Date(firstEvent.startsAt)) : null;
  
  return (
    <section className="me-section me-cover" aria-labelledby="me-cover-title">
      <div className="me-cover-copy">
        <p className="me-kicker me-reveal">Wedding Edition</p>
        <h1 id="me-cover-title" className="me-cover-title me-reveal">
          <span>{groom}</span><span className="me-cover-ampersand">&amp;</span><span>{bride}</span>
        </h1>
        <div className="me-cover-meta me-reveal">
          {date && <time dateTime={firstEvent?.startsAt ?? undefined}>{date}</time>}
          {(firstEvent?.venueName || firstEvent?.address) && <span>{firstEvent.venueName ?? firstEvent.address}</span>}
        </div>
      </div>
      <div className={`me-cover-visual me-paper-layer ${image ? "" : "me-cover-visual-empty"}`}>
        {image ? <img src={image.url} alt={image.caption ?? `Potret pernikahan ${groom} dan ${bride}`} style={{ objectPosition: `${image.focusX * 100}% ${image.focusY * 100}%` }} /> : <span aria-hidden="true">ME / 01</span>}
      </div>
      <span className="me-crop-mark me-crop-mark-top" aria-hidden="true" />
      <span className="me-crop-mark me-crop-mark-bottom" aria-hidden="true" />
    </section>
  );
}
