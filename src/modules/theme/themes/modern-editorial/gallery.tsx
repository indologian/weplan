import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Gallery(_props: SectionRendererProps) {
  void _props;
  return (
    <section
      className="modern-editorial"
      style={{ background: "var(--me-bg)", textAlign: "center" }}
    >
      <p className="me-overline">Galeri</p>
      <hr className="me-rule" style={{ marginBottom: "2rem" }} />
      <p style={{ color: "var(--me-muted)" }}>
        Galeri foto akan tersedia setelah media diunggah.
      </p>
    </section>
  );
}
