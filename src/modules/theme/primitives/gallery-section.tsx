"use client";

import { Lightbox } from "./lightbox";

type GalleryItem = {
  mediaId: string;
  url: string;
  caption?: string;
  alt?: string;
};

type Props = {
  items: GalleryItem[];
  className?: string;
};

export function GallerySection({ items, className }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section className={className} aria-label="Galeri">
      <h3>Galeri</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "0.5rem",
        }}
      >
        {items.map((item) => (
          <Lightbox
            key={item.mediaId}
            src={item.url}
            alt={item.alt ?? item.caption ?? "Foto galeri"}
          />
        ))}
      </div>
    </section>
  );
}
