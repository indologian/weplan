import type { PublicEventDTO } from "@/modules/invitation/types";
import { MapAction } from "./map-action";

function compactUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function calendarUrl(event: PublicEventDTO): string | null {
  if (!event.startsAt) return null;
  const end = event.endsAt ?? new Date(Date.parse(event.startsAt) + 2 * 60 * 60 * 1000).toISOString();
  const parameters = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${compactUtc(event.startsAt)}/${compactUtc(end)}`,
    location: [event.venueName, event.address].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${parameters.toString()}`;
}

export function EventActions({ event }: { event: PublicEventDTO }) {
  const destination = event.latitude !== null && event.longitude !== null
    ? `${event.latitude},${event.longitude}`
    : [event.venueName, event.address].filter(Boolean).join(", ");
  const navigationUrl = destination
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
    : null;
  const mapSrc = event.latitude !== null && event.longitude !== null
    ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}&output=embed`
    : null;
  const saveUrl = calendarUrl(event);

  return (
    <div className="theme-event-actions">
      {saveUrl && <a href={saveUrl} target="_blank" rel="noopener noreferrer">Simpan ke Kalender</a>}
      {navigationUrl && (
        <MapAction venueName={event.venueName} address={event.address} navigationUrl={navigationUrl} mapSrc={mapSrc} />
      )}
    </div>
  );
}
