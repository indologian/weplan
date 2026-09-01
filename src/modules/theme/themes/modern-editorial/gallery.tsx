"use client";

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
    <section className="me-section me-gallery" aria-labelledby="gallery-title">
      <header className="me-gallery-header me-reveal"><h2 id="gallery-title">Dalam bingkai</h2><p>{String(items.length).padStart(2, "0")} photographs</p></header>
      
      <div className="me-gallery-editorial">
        {items.map((item, index) => (
          <div 
            key={item.mediaId} 
            className={`me-gallery-item me-gallery-item-${(index % 6) + 1} me-reveal`}
          >
            <Lightbox
              src={item.url}
              alt={item.alt}
              width={item.width}
              height={item.height}
              focusX={item.focusX}
              focusY={item.focusY}
              className="me-gallery-button"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
