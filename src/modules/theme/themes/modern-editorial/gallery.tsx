"use client";

import { useState } from "react";
import type { SectionRendererProps } from "@/modules/theme/renderer";
import { Lightbox } from "@/modules/theme/primitives/lightbox";

export function Gallery({ invitation }: SectionRendererProps) {
  const items = invitation.media
    .filter((m) => m.purpose === "gallery")
    .map((m) => ({
      mediaId: m.mediaId,
      url: m.url,
      alt: m.caption ?? "Foto galeri pernikahan",
      caption: m.caption,
      width: m.width,
      height: m.height,
      focusX: m.focusX,
      focusY: m.focusY,
    }));

  if (items.length === 0) return null;

  return (
    <section className="modern-editorial" style={{ background: "var(--me-bg)", textAlign: "center" }}>
      <p className="me-overline me-animate">Potret Bahagia</p>
      <hr className="me-rule me-animate me-delay-1" style={{ marginBottom: "3rem" }} />
      
      <div className="me-gallery-editorial">
        {items.map((item, index) => (
          <div 
            key={item.mediaId} 
            className={`me-gallery-item me-animate me-delay-${(index % 3) + 1}`}
          >
            <Lightbox
              src={item.url}
              alt={item.alt}
              width={item.width}
              height={item.height}
              focusX={item.focusX}
              focusY={item.focusY}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
