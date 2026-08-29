"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { MediaUploader } from "@/modules/storage/components/media-uploader";
import type { EditorDTO, ReplaceEditorGalleryAction } from "../types";

type Props = {
  invitationId: string;
  contentVersion: number;
  initialGallery: EditorDTO["gallery"];
  replaceEditorGallery: ReplaceEditorGalleryAction;
  onVersionChange: (version: number) => void;
};

export function InvitationGalleryEditor({
  invitationId,
  contentVersion,
  initialGallery,
  replaceEditorGallery,
  onVersionChange,
}: Props) {
  const [gallery, setGallery] = useState(
    () => initialGallery.map((item) => ({ mediaAssetId: item.mediaAssetId })),
  );
  const [isSaving, setIsSaving] = useState(false);

  const addPhoto = (mediaId: string) => {
    setGallery((current) => [
      ...current,
      { mediaAssetId: mediaId },
    ]);
    toast.success("Foto ditambahkan ke galeri, tekan Simpan untuk memperbarui.");
  };

  const removePhoto = (mediaAssetId: string) => {
    setGallery((current) => current.filter((item) => item.mediaAssetId !== mediaAssetId));
  };

  const saveGallery = async () => {
    setIsSaving(true);
    const result = await replaceEditorGallery({
      invitationId,
      expectedVersion: contentVersion,
      mediaAssetIds: gallery.map((item) => item.mediaAssetId),
    });
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    onVersionChange(result.data.contentVersion);
    toast.success("Galeri berhasil disimpan!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Galeri Foto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {gallery.map((item, index) => (
              <div key={item.mediaAssetId} className="relative aspect-square bg-muted rounded-lg border flex items-center justify-center overflow-hidden group">
                {item.mediaAssetId ? (
                  <img
                    src={`/api/media/${item.mediaAssetId}`}
                    alt={`Gallery ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                )}
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removePhoto(item.mediaAssetId)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="aspect-square flex items-center justify-center p-4 border-2 border-dashed rounded-lg">
              <MediaUploader
                invitationId={invitationId}
                kind="image"
                purpose="gallery"
                label="Tambah Foto"
                onSuccess={addPhoto}
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button type="button" onClick={saveGallery} disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan Perubahan Galeri"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
