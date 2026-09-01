"use client";

import type { SectionRendererProps } from "@/modules/theme/renderer";
import { useState } from "react";
import { Lightbox } from "@/modules/theme/primitives/lightbox";

export function Gallery({ invitation }: SectionRendererProps) {
  const photos = invitation.media.filter(m => m.purpose === "gallery");
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  if (!photos || photos.length === 0) return null;
  const heroPhoto = photos[selectedIndex];
  if (!heroPhoto) return null;

  return (
    <section className="luxury-midnight lm-gallery">
      <div style={{ textAlign: "center", marginBottom: "3rem" }} className="lm-gallery-header">
        <p className="lm-overline">Captured Moments</p>
        <div className="lm-gold-rule" aria-hidden="true" />
      </div>

      <div className="lm-gallery-hero">
        <Lightbox src={heroPhoto.url} alt={heroPhoto.caption ?? ""} width={heroPhoto.width} height={heroPhoto.height} focusX={heroPhoto.focusX} focusY={heroPhoto.focusY} className="lm-gallery-lightbox" />
      </div>
      
      {photos.length > 1 && (
        <div className="lm-gallery-strip">
          {photos.map((photo, index) => (
            <button
              key={photo.mediaId}
              className="lm-gallery-thumb"
              data-selected={index === selectedIndex}
              onClick={() => setSelectedIndex(index)}
              aria-label={`View photo ${index + 1}`}
            >
              <img 
                src={photo.url} 
                alt="" 
                style={{ objectPosition: `${(photo.focusX ?? 0.5) * 100}% ${(photo.focusY ?? 0.5) * 100}%` }} 
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
