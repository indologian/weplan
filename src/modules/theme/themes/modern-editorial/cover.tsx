import type { SectionRendererProps } from "@/modules/theme/renderer";
import { ModernEditorialMotion } from "./motion";
import "./theme.css";

function LeafOrnament(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M50 10C50 10 20 30 20 60C20 80 50 90 50 90C50 90 80 80 80 60C80 30 50 10 50 10Z" stroke="currentColor" strokeWidth="1" />
      <path d="M50 10V90" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function Cover({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom?.name ?? "";
  const bride = invitation.couple.bride?.name ?? "";
  
  return (
    <section className="modern-editorial me-cover">
      <ModernEditorialMotion />
      
      <LeafOrnament className="me-cover-ornament" />
      
      <div className="me-cover-content">
        <p className="me-overline me-animate">Undangan Pernikahan</p>
        
        <h1 className="me-animate me-delay-1">
          <span>{groom}</span>
          <span className="me-cover-and">&</span>
          <span>{bride}</span>
        </h1>
        
        <hr className="me-rule me-animate me-delay-2" />
        
        <p className="me-cover-caption me-animate me-delay-3" style={{ maxWidth: '30ch', color: 'var(--me-muted)' }}>
          Sebuah perayaan tentang cinta, keluarga, dan perjalanan baru.
        </p>
      </div>
    </section>
  );
}
