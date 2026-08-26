import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Gallery(_props: SectionRendererProps) {
  void _props;
  return (
    <section
      className="romantic-floral"
      style={{ background: "var(--rf-bg)", textAlign: "center" }}
    >
      <p className="rf-overline">Galeri</p>
      <div className="rf-floral-divider">
        <span className="rf-floral-dot" />
      </div>
      <p style={{ color: "var(--rf-muted)" }}>
        Galeri foto akan tersedia setelah media diunggah.
      </p>
    </section>
  );
}
