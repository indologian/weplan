"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Music2, VolumeX } from "lucide-react";

type Props = {
  src: string;
  autoPlay?: boolean;
  className?: string;
};

export function MusicController({ src, autoPlay, className }: Props) {
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

  useEffect(() => {
    if (autoPlay && audioRef.current && !playing) {
      audioRef.current.play().then(() => {
        setPlaying(true);
      }).catch(() => {
        // Handle blocked autoplay
      });
    }
  }, [autoPlay]); // Triggered when autoPlay changes

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [playing]);

  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      aria-label={playing ? "Pause musik" : "Putar musik"}
    >
      {playing ? <Music2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
    </button>
  );
}
