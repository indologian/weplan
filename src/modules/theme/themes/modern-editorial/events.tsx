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
    <section
      className="modern-editorial"
      style={{ background: "var(--me-bg)", textAlign: "center" }}
    >
      <p className="me-overline">Acara</p>
      <hr className="me-rule" style={{ marginBottom: "2rem" }} />

      {firstEvent?.startsAt && (
        <Countdown
          targetIso={firstEvent.startsAt}
          style={{
            display: "flex",
            gap: "1.5rem",
            justifyContent: "center",
            fontFamily: "var(--me-font-display)",
            fontSize: "1.5rem",
            marginBottom: "2rem",
          }}
        />
      )}

      {publishableEvents.map((event) => (
        <article
          key={event.eventId}
          style={{
            borderTop: "1px solid var(--me-border)",
            padding: "2rem 0",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--me-font-display)",
              fontSize: "1.5rem",
              fontWeight: 400,
              margin: "0 0 0.5rem",
            }}
          >
            {event.title}
          </h3>
          <p style={{ margin: "0.25rem 0", color: "var(--me-text)" }}>
            {formatDate(event.startsAt, event.timezone)}
          </p>
          <p style={{ margin: "0.25rem 0", color: "var(--me-muted)" }}>
            {formatTime(event.startsAt, event.timezone)}
          </p>
          {event.venueName && (
            <p style={{ margin: "0.5rem 0 0", fontWeight: 500 }}>
              {event.venueName}
            </p>
          )}
          {event.address && (
            <p style={{ fontSize: "0.875rem", color: "var(--me-muted)" }}>
              {event.address}
            </p>
          )}
          <EventActions event={event} />
        </article>
      ))}
    </section>
  );
}
