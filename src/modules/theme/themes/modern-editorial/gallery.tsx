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
      className="modern-editorial"
      style={{ background: "var(--me-bg)", textAlign: "center", padding: "2rem" }}
    >
      <p className="me-overline">Galeri</p>
      <hr className="me-rule" style={{ marginBottom: "2rem" }} />
      <GallerySection items={items} layout="editorial" />
    </section>
  );
}
