import type { SectionRendererProps } from "@/modules/theme/renderer";
import { GallerySection } from "@/modules/theme/primitives/gallery-section";

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
    <section
      className="romantic-floral"
      style={{ background: "var(--rf-bg)", textAlign: "center", padding: "2rem" }}
    >
      <p className="rf-overline">Galeri</p>
      <div className="rf-floral-divider">
        <span className="rf-floral-dot" />
      </div>
      <GallerySection items={items} layout="floral" />
    </section>
  );
}
