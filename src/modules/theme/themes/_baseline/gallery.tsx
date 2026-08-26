import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Gallery(_props: SectionRendererProps) {
  void _props;
  // M6 owns media_assets. Gallery will be populated when M6 is implemented.
  return (
    <section style={{ padding: "2rem" }}>
      <h2>Galeri</h2>
      <p style={{ opacity: 0.7 }}>Galeri foto akan tersedia setelah media diunggah.</p>
    </section>
  );
}
