"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MailOpen, Music2, VolumeX } from "lucide-react";
import { InvitationPhase, InvitationExperienceProvider } from "./invitation-experience";

type Props = {
  children: React.ReactNode;
  className: string;
  guestName: string;
  audioUrl?: string;
  style?: React.CSSProperties;
};

export function InvitationShell({ children, className, guestName, audioUrl, style }: Props) {
  const [phase, setPhase] = useState<InvitationPhase>("closed");
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (phase === "open") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [phase]);

  const completeOpening = useCallback(() => {
    setPhase("open");
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    // Focus handoff
    if (contentRef.current) {
      contentRef.current.focus({ preventScroll: true });
    }
  }, []);

  const openInvitation = () => {
    if (phase !== "closed") return;

    if (audioRef.current) {
      void audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (prefersReducedMotion) {
      completeOpening();
    } else {
      setPhase("opening");
      fallbackTimerRef.current = setTimeout(() => {
        completeOpening();
      }, 1300);
    }
  };

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const handleGateTransitionEnd = (e: React.TransitionEvent) => {
    if (phase === "opening" && e.propertyName === "transform" && e.target === e.currentTarget) {
      completeOpening();
    }
  };

  return (
    <InvitationExperienceProvider phase={phase}>
      <main className={className} style={style} data-invitation-phase={phase}>
        {phase !== "open" && (
          <div 
            className="theme-access-gate" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="invitation-gate-title"
            data-state={phase}
            onTransitionEnd={handleGateTransitionEnd}
          >
            <div className="theme-access-gate-card">
              <p className="theme-overline">Kepada Yth.</p>
              <p className="theme-guest-name">{guestName}</p>
              <h2 id="invitation-gate-title">Undangan Pernikahan</h2>
              <button 
                type="button" 
                onClick={openInvitation} 
                autoFocus 
                disabled={phase !== "closed"}
              >
                <MailOpen aria-hidden="true" size={18} />
                Buka Undangan
              </button>
            </div>
          </div>
        )}

        <div 
          className="theme-content" 
          ref={contentRef}
          tabIndex={-1}
          inert={phase !== "open" ? true : undefined} 
          aria-hidden={phase !== "open"}
          data-state={phase}
          style={{ outline: "none" }}
        >
          {children}
        </div>

        {audioUrl && (
          <>
            <audio
              ref={audioRef}
              src={audioUrl}
              loop
              preload="auto"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
            {phase === "open" && (
              <button
                type="button"
                className="theme-music-control"
                onClick={toggleAudio}
                aria-label={playing ? "Jeda musik" : "Putar musik"}
              >
                {playing ? <Music2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
              </button>
            )}
          </>
        )}
      </main>
    </InvitationExperienceProvider>
  );
}


