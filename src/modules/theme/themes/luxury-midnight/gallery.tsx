import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Gallery(_props: SectionRendererProps) {
  void _props;
  return (
    <section
      className="luxury-midnight"
      style={{ background: "var(--lm-bg)", textAlign: "center" }}
    >
      <p className="lm-overline">Galeri</p>
      <hr className="lm-gold-rule" style={{ marginBottom: "1rem" }} />
      <p style={{ color: "var(--lm-muted)" }}>
        Galeri foto akan tersedia setelah media diunggah.
      </p>
    </section>
  );
}
