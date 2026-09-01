export function LuxuryMonogram({ groom, bride, className = "" }: { groom: string; bride: string; className?: string }) {
  const g = groom.charAt(0).toUpperCase();
  const b = bride.charAt(0).toUpperCase();
  
  return (
    <div className={`lm-monogram-container ${className}`} aria-hidden="true" style={{ position: "relative", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0 }}>
        <circle cx="32" cy="32" r="31" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
        <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.8" />
      </svg>
      <span style={{ fontFamily: "var(--font-lm-display)", fontSize: "1.25rem", color: "currentColor", zIndex: 1, letterSpacing: "0.1em" }}>
        {g}&amp;{b}
      </span>
    </div>
  );
}

export function FineLineFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`lm-fine-frame ${className}`} style={{ position: "relative", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, border: "1px solid var(--lm-accent)", opacity: 0.3, pointerEvents: "none" }} className="lm-frame-border" aria-hidden="true" />
      {children}
    </div>
  );
}

