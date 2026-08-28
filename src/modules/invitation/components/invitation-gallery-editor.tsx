"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { MediaUploader } from "@/modules/storage/components/media-uploader";
import type { EditorDTO, SaveEditorContentAction } from "../types";

type Props = {
  invitationId: string;
  initialVersion: number;
  initialGallery: EditorDTO["loveStory"];
  saveEditorContent: SaveEditorContentAction;
};

export function InvitationGalleryEditor({
  invitationId,
  initialVersion,
  initialGallery,
  saveEditorContent,
}: Props) {
  const [contentVersion, setContentVersion] = useState(initialVersion);
  const [gallery, setGallery] = useState(initialGallery);
  const [isSaving, setIsSaving] = useState(false);

  const addPhoto = (mediaId: string) => {
    setGallery((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        photoMediaId: mediaId,
        date: "",
        title: "",
        body: "",
      },
    ]);
    toast.success("Foto ditambahkan ke galeri, tekan Simpan untuk memperbarui.");
  };

  const removePhoto = (id: string) => {
    setGallery((current) => current.filter((item) => item.id !== id));
  };

  const saveGallery = async () => {
    setIsSaving(true);
    const result = await saveEditorContent({
      invitationId,
      expectedVersion: contentVersion,
      loveStory: gallery,
    });
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setContentVersion(result.data.contentVersion);
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
              <div key={item.id} className="relative aspect-square bg-muted rounded-lg border flex items-center justify-center overflow-hidden group">
                {item.photoMediaId ? (
                  <img 
                    src={`/api/media/${item.photoMediaId}`} 
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
                    onClick={() => removePhoto(item.id)}
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
                purpose="gallery_photo"
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
