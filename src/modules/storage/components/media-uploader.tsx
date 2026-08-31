"use client";

import { useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import { useMediaUpload } from "../hooks";
import type { MediaPurpose } from "../types";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

type Props = {
  invitationId: string;
  kind: "image" | "audio" | "video";
  purpose: MediaPurpose;
  onSuccess: (mediaId: string) => void;
  label?: string;
  accept?: string;
  currentMediaId?: string;
};

export function MediaUploader({ invitationId, kind, purpose, onSuccess, label = "Upload", accept, currentMediaId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { upload, state, progress } = useMediaUpload({
    invitationId,
    kind,
    purpose,
    onComplete: (res) => {
      onSuccess(res.mediaId);
      toast.success("Upload berhasil!");
    },
    onError: (err) => {
      toast.error(err);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validasi basic
    if (kind === "image" && !file.type.startsWith("image/")) {
      toast.error("Format file harus berupa gambar");
      return;
    }
    if (kind === "audio" && !file.type.startsWith("audio/")) {
      toast.error("Format file harus berupa audio");
      return;
    }
    
    upload(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {currentMediaId && kind === "image" && (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
          <img src={`/api/media/${currentMediaId}/medium`} alt="Preview" className="object-cover w-full h-full" />
        </div>
      )}
      {currentMediaId && kind === "audio" && (
        <audio controls src={`/api/media/${currentMediaId}`} className="w-full h-10" />
      )}
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept={accept || (kind === "image" ? "image/*" : kind === "audio" ? "audio/mpeg,.mp3,audio/mp4,.m4a,audio/x-m4a" : "video/*")}
        onChange={handleFileChange} 
      />
      
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => fileInputRef.current?.click()}
        disabled={state === "reserving" || state === "uploading" || state === "processing"}
        className="w-full sm:w-auto flex gap-2 h-10"
      >
        {(state === "reserving" || state === "uploading" || state === "processing") ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Menyimpan... {progress}%
          </>
        ) : (
          <>
            <UploadCloud className="w-4 h-4" />
            {currentMediaId ? "Ganti File" : label}
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground mt-1">
        Maks. ukuran file: {kind === "audio" ? "9 MB" : kind === "video" ? "50 MB" : "10 MB"}
      </p>
    </div>
  );
}
