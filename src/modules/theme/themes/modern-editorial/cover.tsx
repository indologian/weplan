import type { SectionRendererProps } from "@/modules/theme/renderer";
import "./theme.css";

export function Cover({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom?.name ?? "";
  const bride = invitation.couple.bride?.name ?? "";
  return (
    <section className="modern-editorial me-cover">
      <div className="me-cover-index" aria-hidden="true">01 — WEDDING EDITION</div>
      <div className="me-cover-rule" aria-hidden="true" />
      <p className="me-overline">Undangan Pernikahan</p>
      <h1><span>{groom}</span><span className="me-cover-and">&</span><span>{bride}</span></h1>
      <p className="me-cover-caption">Sebuah perayaan tentang cinta, keluarga, dan perjalanan baru.</p>
    </section>
  );
}
