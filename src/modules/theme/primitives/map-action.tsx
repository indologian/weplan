"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  venueName: string;
  address: string;
  navigationUrl: string;
  latitude?: number | null;
  longitude?: number | null;
  mapProvider?: "google_embed" | "openfreemap";
  className?: string;
};

export function MapAction({
  venueName,
  address,
  navigationUrl,
  latitude,
  longitude,
  mapProvider = "google_embed",
  className,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!iframeRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(iframeRef.current);
    return () => observer.disconnect();
  }, []);

  const hasCoords =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  const mapSrc =
    mapProvider === "google_embed" && hasCoords
      ? `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1000!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1`
      : null;

  return (
    <section className={className} aria-label="Lokasi acara">
      <h3>{venueName}</h3>
      <p>{address}</p>

      {mapSrc && (
        <div ref={iframeRef}>
          {isVisible && (
            <iframe
              title={`Peta lokasi ${venueName}`}
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ border: 0, width: "100%", aspectRatio: "16/9" }}
              allowFullScreen={false}
            />
          )}
        </div>
      )}

      <a
        href={navigationUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Buka Navigasi
      </a>
    </section>
  );
}
