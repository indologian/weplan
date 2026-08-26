import type { SectionRendererProps } from "@/modules/theme/renderer";
import { Countdown } from "@/modules/theme/primitives/countdown";
import { MapAction } from "@/modules/theme/primitives/map-action";

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
      className="romantic-floral"
      style={{ background: "var(--rf-bg)", textAlign: "center" }}
    >
      <p className="rf-overline">Acara</p>
      <div className="rf-floral-divider">
        <span className="rf-floral-dot" />
      </div>

      {firstEvent?.startsAt && (
        <Countdown
          targetIso={firstEvent.startsAt}
          style={{
            display: "flex",
            gap: "1.5rem",
            justifyContent: "center",
            fontFamily: "var(--rf-font-display)",
            fontSize: "1.5rem",
            marginBottom: "2rem",
          }}
        />
      )}

      {publishableEvents.map((event) => (
        <article
          key={event.eventId}
          className="rf-card"
          aria-label={event.title}
          style={{ textAlign: "center" }}
        >
          <h3
            style={{
              fontFamily: "var(--rf-font-display)",
              fontSize: "1.5rem",
              fontWeight: 400,
              margin: "0 0 0.75rem",
            }}
          >
            {event.title}
          </h3>
          <p style={{ margin: "0.25rem 0", color: "var(--rf-text)" }}>
            {formatDate(event.startsAt, event.timezone)}
          </p>
          <p style={{ margin: "0.25rem 0", color: "var(--rf-muted)" }}>
            {formatTime(event.startsAt, event.timezone)}
          </p>
          {event.venueName && (
            <p style={{ margin: "0.75rem 0 0", fontWeight: 500 }}>
              {event.venueName}
            </p>
          )}
          {event.address && (
            <p style={{ fontSize: "0.875rem", color: "var(--rf-muted)" }}>
              {event.address}
            </p>
          )}
          {event.latitude && event.longitude && (
            <MapAction
              venueName={event.venueName}
              address={event.address}
              navigationUrl={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
              latitude={event.latitude}
              longitude={event.longitude}
            />
          )}
        </article>
      ))}
    </section>
  );
}
