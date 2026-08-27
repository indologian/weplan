"use client";

import { useEffect, useRef, useState } from "react";
import { Music2, VolumeX } from "lucide-react";

type Props = {
  src: string;
  autoPlay?: boolean;
  className?: string;
};

export function MusicController({ src, autoPlay, className }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  // Sinkronkan state React dengan state asli audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  // Trigger autoplay ketika autoPlay prop bernilai true
  useEffect(() => {
    if (autoPlay && audioRef.current && !playing) {
      audioRef.current.play().catch((e) => console.warn("Autoplay ditolak browser:", e));
    }
  }, [autoPlay]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch((e) => console.warn("Play manual ditolak:", e));
    }
  };

  return (
    <>
      <audio id="wedding-audio" ref={audioRef} src={src} loop preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className={className}
        aria-label={playing ? "Pause musik" : "Putar musik"}
      >
        {playing ? <Music2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
      </button>
    </>
  );
}
