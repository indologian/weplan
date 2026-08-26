"use client";

import { useEffect, useState } from "react";

type Props = {
  targetIso: string;
  className?: string;
  style?: React.CSSProperties;
};

function getUnits(targetMs: number, nowMs: number) {
  const diff = Math.max(0, targetMs - nowMs);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  return { days, hours, minutes, seconds };
}

export function Countdown({ targetIso, className, style }: Props) {
  const [units, setUnits] = useState(() =>
    getUnits(Date.parse(targetIso), Date.now()),
  );

  useEffect(() => {
    const targetMs = Date.parse(targetIso);
    if (Number.isNaN(targetMs)) return;
    const id = setInterval(() => {
      setUnits(getUnits(targetMs, Date.now()));
    }, 1_000);
    return () => clearInterval(id);
  }, [targetIso]);

  return (
    <div className={className} style={style} aria-label="Hitung mundur">
      <span aria-label={`${units.days} hari`}>
        {String(units.days).padStart(2, "0")}
      </span>
      <span aria-hidden="true">:</span>
      <span aria-label={`${units.hours} jam`}>
        {String(units.hours).padStart(2, "0")}
      </span>
      <span aria-hidden="true">:</span>
      <span aria-label={`${units.minutes} menit`}>
        {String(units.minutes).padStart(2, "0")}
      </span>
      <span aria-hidden="true">:</span>
      <span aria-label={`${units.seconds} detik`}>
        {String(units.seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
