import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Gallery(_props: SectionRendererProps) {
  void _props;
  return (
    <section
      className="javanese-heritage"
      style={{ background: "var(--jh-bg)", textAlign: "center" }}
    >
      <p className="jh-overline">Galeri</p>
      <hr className="jh-gold-rule" style={{ marginBottom: "1rem" }} />
      <p style={{ color: "var(--jh-muted)" }}>
        Galeri foto akan tersedia setelah media diunggah.
      </p>
    </section>
  );
}
