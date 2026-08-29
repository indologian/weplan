"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  className?: string;
  width?: number | null;
  height?: number | null;
  focusX?: number;
  focusY?: number;
};

export function Lightbox({ src, alt, className, width, height, focusX = 0.5, focusY = 0.5 }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = useCallback(() => {
    dialogRef.current?.showModal();
  }, []);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    dialog.addEventListener("keydown", handleKeyDown);
    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={className}
        aria-label={`Perbesar: ${alt}`}
      >
        <Image unoptimized
          src={src}
          alt={alt}
          width={width ?? 800}
          height={height ?? 600}
          sizes="(max-width: 480px) 50vw, 240px"
          style={{ width: "100%", height: "auto", aspectRatio: "4 / 5", objectFit: "cover", objectPosition: `${focusX * 100}% ${focusY * 100}%` }}
        />
      </button>
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        style={{
          border: "none",
          background: "transparent",
          maxWidth: "90vw",
          maxHeight: "90vh",
          padding: 0,
        }}
      >
        <Image unoptimized
          src={src}
          alt={alt}
          width={width ?? 1200}
          height={height ?? 900}
          sizes="90vw"
          style={{ width: "auto", height: "auto", maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain" }}
        />
        <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
          <button type="button" onClick={close} aria-label="Tutup">
            Tutup
          </button>
        </div>
      </dialog>
    </>
  );
}
