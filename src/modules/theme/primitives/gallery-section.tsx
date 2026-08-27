"use client";

import { Lightbox } from "./lightbox";

type GalleryItem = {
  mediaId: string;
  url: string;
  caption?: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
  focusX?: number;
  focusY?: number;
};

type Props = {
  items: GalleryItem[];
  className?: string;
  layout?: "default" | "editorial" | "floral" | "heritage" | "luxury";
};

export function GallerySection({ items, className, layout = "default" }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section className={className} aria-label="Galeri">
      <h3>Galeri</h3>
      <div
        className={`theme-gallery-grid theme-gallery-${layout}`}
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
            width={item.width}
            height={item.height}
            focusX={item.focusX}
            focusY={item.focusY}
          />
        ))}
      </div>
    </section>
  );
}
