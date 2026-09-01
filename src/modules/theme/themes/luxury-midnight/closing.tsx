import type { SectionRendererProps } from "@/modules/theme/renderer";
import { LuxuryMonogram } from "./ornaments";
import "./theme.css";

export function Closing({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom?.name ?? "Groom";
  const bride = invitation.couple.bride?.name ?? "Bride";

  return (
    <section className="luxury-midnight lm-closing">
      <LuxuryMonogram groom={groom} bride={bride} className="lm-closing-monogram" />
      
      <h2>
        <span style={{ display: "block", color: "var(--lm-accent)", fontSize: "0.5em", fontStyle: "italic", marginBottom: "0.5rem" }}>Thank You</span>
        <span className="lm-closing-names">{groom} &amp; {bride}</span>
      </h2>
      
      <div className="lm-gold-rule" aria-hidden="true" style={{ margin: "2rem auto" }} />
      
      <p style={{ color: "var(--lm-muted)", fontSize: "0.875rem", letterSpacing: "0.05em" }}>
        Weplan Digital Invitation
      </p>
    </section>
  );
}

