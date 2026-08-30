"use client";

import { useCallback, useState } from "react";
import type { MediaPurpose } from "./types";

export type UploadState = "idle" | "reserving" | "uploading" | "processing" | "success" | "error";

export type UploadResult = {
  mediaId: string;
  url?: string;
};

type UseMediaUploadOptions = {
  invitationId: string;
  kind: "image" | "audio" | "video";
  purpose: MediaPurpose;
  onComplete?: (result: UploadResult) => void;
  onError?: (error: string) => void;
};

export function useMediaUpload({ invitationId, kind, purpose, onComplete, onError }: UseMediaUploadOptions) {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    setState("reserving");
    setError(null);
    setProgress(0);

    try {
      let fileToUpload = file;
      
      // Client-side image compression
      if (kind === "image") {
        try {
          const imageCompression = (await import("browser-image-compression")).default;
          const options = {
            maxSizeMB: 1, // Compress to ~1MB
            maxWidthOrHeight: 1920, // Max dimension
            useWebWorker: true,
          };
          fileToUpload = await imageCompression(file, options) as File;
        } catch (compressionError) {
          console.warn("Gagal melakukan kompresi di peramban, menggunakan file asli", compressionError);
        }
      }

      const slice = fileToUpload.slice(0, 4100);
      const arrayBuffer = await slice.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i] ?? 0);
      }
      const firstBytesBase64 = window.btoa(binary);

      const requestResponse = await fetch("/api/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          invitationId,
          kind,
          purpose,
          filename: fileToUpload.name || file.name,
          mimeType: fileToUpload.type || file.type,
          byteSize: fileToUpload.size,
          firstBytesBase64,
        }),
      });

      const requestData = await requestResponse.json();
      if (!requestData.success) {
        throw new Error(requestData.error || "Failed to request upload.");
      }

      const { mediaId, uploadUrl } = requestData.data;

      setState("uploading");
      setProgress(10);

      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(10 + Math.round((e.loaded / e.total) * 70));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(80);
            resolve();
          } else {
            reject(new Error("Upload failed."));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed.")));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", fileToUpload.type || file.type);
        xhr.send(fileToUpload);
      });

      setState("processing");
      setProgress(85);

      const completeResponse = await fetch("/api/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          mediaId,
          invitationId,
        }),
      });

      const completeData = await completeResponse.json();
      if (!completeData.success) {
        throw new Error(completeData.error || "Failed to complete upload.");
      }

      setProgress(100);
      setState("success");
      onComplete?.({ mediaId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setState("error");
      setError(message);
      onError?.(message);
    }
  }, [invitationId, kind, purpose, onComplete, onError]);

  const reset = useCallback(() => {
    setState("idle");
    setProgress(0);
    setError(null);
  }, []);

  return { upload, state, progress, error, reset };
}
