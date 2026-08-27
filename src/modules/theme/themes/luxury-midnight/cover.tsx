import type { SectionRendererProps } from "@/modules/theme/renderer";
import "./theme.css";

export function Cover({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom?.name ?? "";
  const bride = invitation.couple.bride?.name ?? "";
  const monogram = `${groom.charAt(0)}${bride.charAt(0)}`;
  return (
    <section className="luxury-midnight lm-cover">
      <div className="lm-cover-orbit" aria-hidden="true" />
      <div className="lm-monogram" aria-hidden="true"><span className="lm-monogram-inner">{monogram}</span></div>
      <p className="lm-overline">An Evening of Celebration</p>
      <h1><span>{groom}</span><span aria-hidden="true">×</span><span>{bride}</span></h1>
      <div className="lm-divider" aria-hidden="true"><span className="lm-gold-dot" /></div>
      <p>Undangan Pernikahan</p>
    </section>
  );
}
