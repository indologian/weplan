import type { SectionRendererProps } from "@/modules/theme/renderer";
import "./theme.css";

export function Cover({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom?.name ?? "";
  const bride = invitation.couple.bride?.name ?? "";
  return (
    <section className="javanese-heritage jh-cover">
      <div className="jh-cover-crown" aria-hidden="true"><span /></div>
      <p className="jh-overline">Pawiwahan</p>
      <div className="jh-cover-panel">
        <p>Undangan Pernikahan</p>
        <h1><span>{groom}</span><span aria-hidden="true">◆</span><span>{bride}</span></h1>
      </div>
      <div className="jh-chapter-rule" aria-hidden="true" />
      <p className="jh-cover-note">Dengan hormat, kami mengundang Anda untuk menyaksikan hari bahagia kami.</p>
    </section>
  );
}
