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
    <section style={{ padding: "2rem" }}>
      <h2>Acara</h2>

      {firstEvent?.startsAt && (
        <Countdown
          targetIso={firstEvent.startsAt}
          style={{ display: "flex", gap: "0.5rem", justifyContent: "center", fontSize: "1.5rem" }}
        />
      )}

      {publishableEvents.map((event) => (
        <article
          key={event.eventId}
          style={{
            border: "1px solid #e5e5e5",
            borderRadius: "0.5rem",
            padding: "1.5rem",
            marginTop: "1rem",
          }}
        >
          <h3>{event.title}</h3>
          <p>{formatDate(event.startsAt, event.timezone)}</p>
          <p>{formatTime(event.startsAt, event.timezone)}</p>
          {event.venueName && <p>{event.venueName}</p>}
          {event.address && <p style={{ fontSize: "0.875rem", opacity: 0.7 }}>{event.address}</p>}
          <EventActions event={event} />
        </article>
      ))}
    </section>
  );
}
