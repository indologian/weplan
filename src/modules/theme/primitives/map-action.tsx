"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  venueName: string;
  address: string;
  navigationUrl: string;
  mapSrc?: string | null;
  className?: string;
};

export function MapAction({
  venueName,
  address,
  navigationUrl,
  mapSrc,
  className,
}: Props) {
  const iframeRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!iframeRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(iframeRef.current);
    return () => observer.disconnect();
  }, []);

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
