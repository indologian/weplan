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

function RingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="12" r="5" />
      <circle cx="15" cy="12" r="5" />
      <path d="M9 7l1-2l1 2" />
      <path d="M15 7l-1-2l-1 2" />
    </svg>
  );
}

function LocationIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function Events({ invitation }: SectionRendererProps) {
  const publishableEvents = invitation.events.filter(
    (event) => event.title && event.startsAt,
  );

  if (publishableEvents.length === 0) return null;

  const firstEvent = publishableEvents[0];

  return (
    <section className="modern-editorial" style={{ background: "var(--me-surface)", textAlign: "center" }}>
      <p className="me-overline me-animate">Rangkaian Acara</p>
      <hr className="me-rule me-animate me-delay-1" style={{ marginBottom: "3rem" }} />

      {firstEvent?.startsAt && (
        <div className="me-animate me-delay-2" style={{ marginBottom: "3rem" }}>
          <Countdown
            targetIso={firstEvent.startsAt}
            style={{
              display: "flex",
              gap: "2rem",
              justifyContent: "center",
              fontFamily: "var(--me-font-display)",
              fontSize: "2rem",
              color: "var(--me-accent)",
            }}
          />
        </div>
      )}

      <div className="me-events-grid">
        {publishableEvents.map((event, index) => {
          const isFirst = index === 0;
          return (
            <article
              key={event.eventId}
              className={`me-event-card me-animate me-delay-${index + 1}`}
            >
              {isFirst ? <RingsIcon className="me-icon" /> : <LocationIcon className="me-icon" />}
              <h3 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>
                {event.title}
              </h3>
              
              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ margin: "0", color: "var(--me-text)", fontSize: "1.125rem" }}>
                  {formatDate(event.startsAt, event.timezone)}
                </p>
                <p style={{ margin: "0.25rem 0 0", color: "var(--me-muted)" }}>
                  Pukul {formatTime(event.startsAt, event.timezone)} {event.endsAt ? `- ${formatTime(event.endsAt, event.timezone)}` : ''}
                </p>
              </div>

              {(event.venueName || event.address) && (
                <div style={{ marginBottom: "1.5rem" }}>
                  {event.venueName && (
                    <p style={{ margin: "0 0 0.25rem", fontWeight: 500, letterSpacing: "0.05em" }}>
                      {event.venueName}
                    </p>
                  )}
                  {event.address && (
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--me-muted)", lineHeight: 1.6 }}>
                      {event.address}
                    </p>
                  )}
                </div>
              )}
              
              <div style={{ marginTop: "2rem" }}>
                <EventActions event={event} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
