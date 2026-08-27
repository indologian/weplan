"use client";

import { useCallback, useState } from "react";

type UploadState = "idle" | "requesting" | "uploading" | "processing" | "complete" | "error";

type UploadResult = {
  mediaId: string;
};

type UseMediaUploadOptions = {
  invitationId: string;
  kind: "image" | "audio" | "video";
  purpose: string;
  onComplete?: (result: UploadResult) => void;
  onError?: (error: string) => void;
};

export function useMediaUpload({ invitationId, kind, purpose, onComplete, onError }: UseMediaUploadOptions) {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    setState("requesting");
    setError(null);
    setProgress(0);

    try {
      const requestResponse = await fetch("/api/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          invitationId,
          kind,
          purpose,
          filename: file.name,
          mimeType: file.type,
          byteSize: file.size,
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
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
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
      setState("complete");
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
