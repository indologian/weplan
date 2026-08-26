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
      className="javanese-heritage"
      style={{ background: "var(--jh-bg)", textAlign: "center" }}
    >
      <p className="jh-overline">Acara</p>
      <hr className="jh-gold-rule" style={{ marginBottom: "2rem" }} />

      {firstEvent?.startsAt && (
        <Countdown
          targetIso={firstEvent.startsAt}
          style={{
            display: "flex",
            gap: "1.5rem",
            justifyContent: "center",
            fontFamily: "var(--jh-font-display)",
            fontSize: "1.5rem",
            marginBottom: "2rem",
          }}
        />
      )}

      <div
        style={{
          maxWidth: "400px",
          margin: "0 auto",
          position: "relative",
          paddingLeft: "2rem",
          textAlign: "left",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "2px",
            background: "var(--jh-gold-rule)",
          }}
          aria-hidden="true"
        />
        {publishableEvents.map((event) => (
          <article
            key={event.eventId}
            className="jh-geometric-border"
            aria-label={event.title}
            style={{ padding: "1.5rem", marginBottom: "1rem" }}
          >
            <h3
              style={{
                fontFamily: "var(--jh-font-display)",
                fontSize: "1.25rem",
                fontWeight: 700,
                margin: "0 0 0.5rem",
                letterSpacing: "0.05em",
              }}
            >
              {event.title}
            </h3>
            <p style={{ margin: "0.25rem 0", color: "var(--jh-text)" }}>
              {formatDate(event.startsAt, event.timezone)}
            </p>
            <p style={{ margin: "0.25rem 0", color: "var(--jh-muted)" }}>
              {formatTime(event.startsAt, event.timezone)}
            </p>
            {event.venueName && (
              <p style={{ margin: "0.5rem 0 0", fontWeight: 500 }}>
                {event.venueName}
              </p>
            )}
            {event.address && (
              <p style={{ fontSize: "0.875rem", color: "var(--jh-muted)" }}>
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
      </div>
    </section>
  );
}
