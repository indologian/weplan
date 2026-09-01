"use client";

import type { SectionRendererProps } from "@/modules/theme/renderer";
import { Lightbox } from "@/modules/theme/primitives/lightbox";
import { useState } from "react";

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

  const [selectedId, setSelectedId] = useState(items[0]?.mediaId ?? "");
  if (items.length === 0) return null;
  const selected = items.find((item) => item.mediaId === selectedId) ?? items[0]!;

  return (
    <section className="me-section me-gallery" aria-labelledby="gallery-title">
      <header className="me-gallery-header me-reveal"><h2 id="gallery-title">Dalam bingkai</h2><p>{String(items.length).padStart(2, "0")} photographs</p></header>
      
      <div className="me-gallery-editorial">
        <div className="me-gallery-hero" key={selected.mediaId}>
          <Lightbox src={selected.url} alt={selected.alt} width={selected.width} height={selected.height} focusX={selected.focusX} focusY={selected.focusY} className="me-gallery-button me-gallery-hero-button" />
          <span aria-hidden="true">SELECTED / {String(items.findIndex((item) => item.mediaId === selected.mediaId) + 1).padStart(2, "0")}</span>
        </div>
        <div className="me-gallery-strip" aria-label="Pilih foto utama">
          {items.map((item, index) => (
            <button key={item.mediaId} type="button" className="me-gallery-select" aria-label={`Tampilkan foto ${index + 1} sebagai foto utama`} aria-pressed={item.mediaId === selected.mediaId} onClick={() => setSelectedId(item.mediaId)}>
              <img src={item.url} alt="" style={{ objectPosition: `${item.focusX * 100}% ${item.focusY * 100}%` }} />
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
