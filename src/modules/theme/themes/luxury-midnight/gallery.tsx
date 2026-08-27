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
      className="luxury-midnight"
      style={{ background: "var(--lm-bg)", textAlign: "center", padding: "2rem" }}
    >
      <p className="lm-overline">Galeri</p>
      <hr className="lm-gold-rule" style={{ marginBottom: "1rem" }} />
      <GallerySection items={items} layout="luxury" />
    </section>
  );
}
