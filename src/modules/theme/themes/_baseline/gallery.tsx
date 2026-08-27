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

  return <GallerySection items={items} />;
}
