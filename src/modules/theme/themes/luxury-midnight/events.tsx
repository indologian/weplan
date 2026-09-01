import type { SectionRendererProps } from "@/modules/theme/renderer";
import { Countdown } from "@/modules/theme/primitives/countdown";
import { EventActions } from "@/modules/theme/primitives/event-actions";
import { FineLineFrame } from "./ornaments";

function getDay(iso: string | null, timezone: string | null): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      timeZone: timezone ?? "Asia/Jakarta",
    }).format(date);
  } catch {
    return "";
  }
}

function getMonthYear(iso: string | null, timezone: string | null): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: timezone ?? "Asia/Jakarta",
    }).format(date);
  } catch {
    return "";
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
    <section className="luxury-midnight lm-events">
      <div style={{ textAlign: "center", marginBottom: "4rem" }} className="lm-events-header">
        <p className="lm-overline">The Celebration</p>
        <div className="lm-gold-rule" aria-hidden="true" />
      </div>

      {firstEvent?.startsAt && (
        <div className="lm-countdown-wrapper" style={{ marginBottom: "4rem" }}>
          <FineLineFrame className="lm-countdown-frame">
            <Countdown
              targetIso={firstEvent.startsAt}
              style={{
                display: "flex",
                gap: "2rem",
                justifyContent: "center",
                fontFamily: "var(--font-lm-display)",
                color: "var(--lm-accent)",
                padding: "2rem 1rem",
              }}
            />
          </FineLineFrame>
        </div>
      )}

      {publishableEvents.map((event) => (
        <article
          key={event.eventId}
          className="lm-event-card"
          aria-label={event.title}
        >
          <div style={{ padding: "3rem 1.5rem" }}>
            <p className="lm-overline" style={{ marginBottom: "1.5rem" }}>{event.title}</p>
            
            <div className="lm-event-date-large">
              {getDay(event.startsAt, event.timezone)}
            </div>
            
            <p style={{ color: "var(--lm-text)", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              {getMonthYear(event.startsAt, event.timezone)}
            </p>
            
            <p style={{ color: "var(--lm-accent)", marginBottom: "2rem" }}>
              {formatTime(event.startsAt, event.timezone)} WIB
            </p>
            
            {event.venueName && (
              <p style={{ fontWeight: 500, color: "var(--lm-text)", fontSize: "1.125rem", marginBottom: "0.5rem" }}>
                {event.venueName}
              </p>
            )}
            
            {event.address && (
              <p style={{ fontSize: "0.875rem", color: "var(--lm-muted)", marginBottom: "2rem" }}>
                {event.address}
              </p>
            )}
            
            <EventActions event={event} />
          </div>
        </article>
      ))}
    </section>
  );
}


