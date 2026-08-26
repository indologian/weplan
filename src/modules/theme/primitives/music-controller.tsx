"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  className?: string;
};

export function MusicController({ src, className }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = "metadata";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [src]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        // autoplay blocked — user needs to interact first
      });
    }
    setPlaying((p) => !p);
  }, [playing]);

  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      aria-label={playing ? "Pause musik" : "Putar musik"}
    >
      {playing ? "⏸" : "🎵"}
    </button>
  );
}
