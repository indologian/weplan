import type { SectionRendererProps } from "@/modules/theme/renderer";
import "./theme.css";

export function Cover({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom?.name ?? "";
  const bride = invitation.couple.bride?.name ?? "";
  return (
    <section className="romantic-floral rf-cover">
      <div className="rf-cover-bloom rf-cover-bloom-left" aria-hidden="true" />
      <div className="rf-cover-bloom rf-cover-bloom-right" aria-hidden="true" />
      <div className="rf-cover-frame">
        <p className="rf-overline">Undangan Pernikahan</p>
        <div className="rf-rose-ornament" aria-hidden="true" />
        <h1><span>{groom}</span><span className="rf-ampersand" aria-hidden="true">&</span><span>{bride}</span></h1>
        <p>Dengan penuh cinta, kami mengundang Anda.</p>
      </div>
    </section>
  );
}
