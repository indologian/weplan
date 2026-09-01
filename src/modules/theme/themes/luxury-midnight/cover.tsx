import type { SectionRendererProps } from "@/modules/theme/renderer";
import { LuxuryMonogram } from "./ornaments";
import "./theme.css";

export function Cover({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom?.name ?? "Groom";
  const bride = invitation.couple.bride?.name ?? "Bride";
  
  // Find a suitable hero/cover image
  const coverImage = invitation.media.find((item) => item.purpose === "gallery") ?? null;

  return (
    <section className="luxury-midnight lm-cover">
      {coverImage ? (
        <div className="lm-cover-media">
          <img 
            src={coverImage.url} 
            alt="Cover" 
            style={{ 
              objectPosition: `${coverImage.focusX * 100}% ${coverImage.focusY * 100}%` 
            }} 
          />
        </div>
      ) : (
        <div className="lm-cover-media lm-cover-fallback" />
      )}
      
      <div className="lm-cover-content">
        <LuxuryMonogram groom={groom} bride={bride} className="lm-cover-monogram" />
        
        <div className="lm-cover-title-group">
          <h1>
            <span className="lm-cover-groom">{groom}</span>
            <span aria-hidden="true" className="lm-cover-amp">&amp;</span>
            <span className="lm-cover-bride">{bride}</span>
          </h1>
        </div>
        
        <div className="lm-gold-rule lm-cover-line" aria-hidden="true" />
        
        <p className="lm-overline lm-cover-subtitle">Undangan Pernikahan</p>
      </div>
    </section>
  );
}


