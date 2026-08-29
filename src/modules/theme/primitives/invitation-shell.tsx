"use client";

import { useEffect, useRef, useState } from "react";
import { MailOpen, Music2, VolumeX } from "lucide-react";

type Props = {
  children: React.ReactNode;
  className: string;
  guestName: string;
  audioUrl?: string;
  style?: React.CSSProperties;
};

export function InvitationShell({ children, className, guestName, audioUrl, style }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const openInvitation = () => {
    setIsOpen(true);
    if (audioRef.current) {
      void audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
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

  return (
    <main className={className} style={style}>
      {!isOpen && (
        <div className="theme-access-gate" role="dialog" aria-modal="true" aria-labelledby="invitation-gate-title">
          <div className="theme-access-gate-card">
            <p className="theme-overline">Kepada Yth.</p>
            <p className="theme-guest-name">{guestName}</p>
            <h2 id="invitation-gate-title">Undangan Pernikahan</h2>
            <button type="button" onClick={openInvitation} autoFocus>
              <MailOpen aria-hidden="true" size={18} />
              Buka Undangan
            </button>
          </div>
        </div>
      )}

      <div className="theme-content" inert={!isOpen ? true : undefined} aria-hidden={!isOpen}>
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
          {isOpen && (
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
  );
}
