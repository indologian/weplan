import type { SectionRendererProps } from "@/modules/theme/renderer";
import { Countdown } from "@/modules/theme/primitives/countdown";
import { EventActions } from "@/modules/theme/primitives/event-actions";

function formatDate(iso: string | null, timezone: string | null): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: timezone ?? "Asia/Jakarta",
    }).format(date);
  } catch {
    return iso;
  }
}

function formatTime(iso: string | null, timezone: string | null): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone ?? "Asia/Jakarta",
    }).format(date);
  } catch {
    return "";
  }
}

export function Events({ invitation }: SectionRendererProps) {
  const publishableEvents = invitation.events.filter(
    (event) => event.title && event.startsAt,
  );

  if (publishableEvents.length === 0) return null;

  const firstEvent = publishableEvents[0];

  return (
    <section className="me-section me-events" aria-labelledby="events-title">
      <header className="me-events-header me-reveal"><span>Program</span><h2 id="events-title">Rangkaian acara</h2></header>

      {firstEvent?.startsAt && (
        <div className="me-countdown me-reveal">
          <Countdown
            targetIso={firstEvent.startsAt}
          />
          <div className="me-countdown-labels" aria-hidden="true"><span>Hari</span><span>Jam</span><span>Menit</span><span>Detik</span></div>
        </div>
      )}

      <div className="me-events-grid">
        {publishableEvents.map((event, index) => {
          return (
            <article
              key={event.eventId}
              className="me-event-card me-reveal"
            >
              <span className="me-event-index">{String(index + 1).padStart(2, "0")}</span>
              <h3>{event.title}</h3>
              
              <div className="me-event-date">
                <p>
                  {formatDate(event.startsAt, event.timezone)}
                </p>
                <p>
                  Pukul {formatTime(event.startsAt, event.timezone)} {event.endsAt ? `- ${formatTime(event.endsAt, event.timezone)}` : ''}
                </p>
              </div>

              {(event.venueName || event.address) && (
                <div className="me-event-venue">
                  {event.venueName && (
                    <p>
                      {event.venueName}
                    </p>
                  )}
                  {event.address && (
                    <p>
                      {event.address}
                    </p>
                  )}
                </div>
              )}
              
              <div className="me-event-actions-wrap">
                <EventActions event={event} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
