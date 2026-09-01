import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Closing({ invitation }: SectionRendererProps) {
  const groomName = invitation.couple.groom?.name ?? "";
  const brideName = invitation.couple.bride?.name ?? "";

  return (
    <section
      className="me-section me-closing"
    >
      <span className="me-closing-mark" aria-hidden="true">ME / 01</span>
      <p className="me-closing-note me-reveal">
        Terima kasih telah menjadi bagian dari hari bahagia kami.
      </p>
      <h2 className="me-closing-names me-reveal">
        {groomName} & {brideName}
      </h2>
      <div className="me-closing-colophon"><span>Wedding Edition</span><span>Terima kasih</span></div>
    </section>
  );
}
