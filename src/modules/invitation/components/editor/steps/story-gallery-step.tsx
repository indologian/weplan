"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Trash2, Image as ImageIcon, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { MediaUploader } from "@/modules/storage/components/media-uploader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shared/components/ui/alert-dialog";
import { AutosaveQueue, type AutosaveResult } from "../../../autosave-queue";
import { useEditorWorkspace } from "../editor-workspace-context";
import type { EditorDTO, SaveEditorContentAction, ReplaceEditorGalleryAction } from "../../../types";

type LoveStoryForm = {
  loveStory: Array<{
    id: string;
    date: string;
    title: string;
    body: string;
    photoMediaId: string;
  }>;
};

export function StoryGalleryStep({
  invitationId,
  initialData,
  saveEditorContent,
  replaceEditorGallery,
}: {
  invitationId: string;
  initialData: EditorDTO;
  saveEditorContent: SaveEditorContentAction;
  replaceEditorGallery: ReplaceEditorGalleryAction;
}) {
  const { contentVersion, setContentVersion, registerFlushCallback, unregisterFlushCallback, saveState, setSaveState, setConflictState } = useEditorWorkspace();
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  // --- Love Story Form Logic ---
  const { control, register, setValue } = useForm<LoveStoryForm>({
    defaultValues: {
      loveStory: initialData.loveStory.length > 0 ? initialData.loveStory.map(item => ({
        id: item.id,
        date: item.date ?? "",
        title: item.title ?? "",
        body: item.body ?? "",
        photoMediaId: item.photoMediaId ?? "",
      })) : [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "loveStory",
  });

  const rawLoveStoryValues = useWatch({ control, name: "loveStory" });
  const loveStoryValues = useMemo(() => rawLoveStoryValues || [], [rawLoveStoryValues]);

  const [autosaveQueue] = useState(
    () =>
      new AutosaveQueue<LoveStoryForm>(
        contentVersion,
        async (snapshot, expectedVersion): Promise<AutosaveResult> => {
          const result = await saveEditorContent({
            invitationId: initialData.invitationId,
            expectedVersion,
            loveStory: snapshot.loveStory.map(item => ({
              id: item.id,
              ...(item.date ? { date: item.date } : {}),
              ...(item.title ? { title: item.title } : {}),
              ...(item.body ? { body: item.body } : {}),
              ...(item.photoMediaId ? { photoMediaId: item.photoMediaId } : {}),
            })),
          });
          if (result.success)
            return {
              success: true,
              contentVersion: result.data.contentVersion,
            };
          return {
            success: false,
            code:
              result.code === "VERSION_CONFLICT" ||
              result.code === "VALIDATION_ERROR"
                ? result.code
                : "TEMPORARY_ERROR",
          };
        },
      ),
  );

  const [localEditGeneration, setLocalEditGeneration] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  const flushSaveQueue = useCallback(async () => {
    if (!autosaveQueue.state.pendingSave) return { success: true };
    setSaveState("saving");
    const result = await autosaveQueue.flush();
    if (!result) return { success: true };
    if (!result.success) {
      if (result.code === "VERSION_CONFLICT") {
        setConflictState(true);
        setSaveState("conflict");
      } else {
        setSaveState("error");
      }
      return { success: false, error: result.code };
    }
    setContentVersion(result.contentVersion);
    setSaveState("saved");
    return { success: true, version: result.contentVersion };
  }, [autosaveQueue, setContentVersion, setSaveState, setConflictState]);

  useEffect(() => {
    registerFlushCallback("story", flushSaveQueue);
    return () => unregisterFlushCallback("story");
  }, [registerFlushCallback, unregisterFlushCallback, flushSaveQueue]);

  useEffect(() => {
    autosaveQueue.adoptServerVersion(contentVersion);
  }, [contentVersion, autosaveQueue]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    const generation = autosaveQueue.markDirty({ loveStory: loveStoryValues });
    setLocalEditGeneration(generation);
    setSaveState("dirty");
  }, [autosaveQueue, loveStoryValues, setSaveState]);

  useEffect(() => {
    if (localEditGeneration === 0 || saveState === "conflict") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flushSaveQueue(), 1000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [flushSaveQueue, localEditGeneration, saveState]);


  // --- Gallery Logic ---
  const [gallery, setGallery] = useState(
    () => initialData.gallery.map((item) => ({ mediaAssetId: item.mediaAssetId })),
  );
  const [isSavingGallery, setIsSavingGallery] = useState(false);

  const addPhoto = (mediaId: string) => {
    setGallery((current) => [
      ...current,
      { mediaAssetId: mediaId },
    ]);
    toast.success("Foto ditambahkan ke galeri, tekan Simpan untuk memperbarui.");
  };

  const removePhoto = (mediaAssetId: string) => {
    setGallery((current) => current.filter((item) => item.mediaAssetId !== mediaAssetId));
    setPhotoToDelete(null);
  };

  const saveGallery = async () => {
    setIsSavingGallery(true);
    const result = await replaceEditorGallery({
      invitationId,
      expectedVersion: contentVersion,
      mediaAssetIds: gallery.map((item) => item.mediaAssetId),
    });
    setIsSavingGallery(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setContentVersion(result.data.contentVersion);
    toast.success("Galeri berhasil disimpan!");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div>
            <CardTitle>Cerita Cinta</CardTitle>
            <CardDescription>Bagikan momen-momen penting dalam perjalanan cinta Anda berdua.</CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => append({ id: crypto.randomUUID(), date: "", title: "", body: "", photoMediaId: "" })}
            className="gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" /> Tambah Cerita
          </Button>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {fields.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              Belum ada cerita yang ditambahkan.
            </div>
          )}

          <div className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-5 space-y-6 bg-card shadow-sm">
                <div className="flex items-center justify-between border-b pb-4">
                  <h3 className="font-semibold text-lg">{loveStoryValues[index]?.title || "Cerita Baru"}</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 ml-2"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tanggal / Momen</Label>
                      <Input
                        {...register(`loveStory.${index}.date`)}
                        placeholder="Contoh: 14 Februari 2023"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Judul Cerita</Label>
                      <Input
                        {...register(`loveStory.${index}.title`)}
                        placeholder="Contoh: Pertama Kali Bertemu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Deskripsi Cerita</Label>
                      <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        {...register(`loveStory.${index}.body`)}
                        placeholder="Ceritakan momen tersebut secara singkat..."
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Foto Momen (Opsional)</Label>
                    <MediaUploader
                      invitationId={invitationId}
                      kind="image"
                      purpose="love_story"
                      label="Upload Foto Momen"
                      currentMediaId={loveStoryValues[index]?.photoMediaId}
                      onSuccess={(mediaId) => setValue(`loveStory.${index}.photoMediaId`, mediaId, { shouldDirty: true })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Galeri Foto</CardTitle>
          <CardDescription>Unggah foto-foto kebersamaan Anda untuk ditampilkan di undangan.</CardDescription>
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
                
                {/* Mobile-friendly overlay that is also hoverable on desktop */}
                <div className="absolute bottom-2 right-2 sm:inset-0 sm:bg-black/50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 shadow-md"
                    onClick={() => setPhotoToDelete(item.mediaAssetId)}
                  >
                    <Trash2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Hapus</span>
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="aspect-square flex items-center justify-center p-4 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
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
            <Button type="button" onClick={() => void saveGallery()} disabled={isSavingGallery}>
              {isSavingGallery ? "Menyimpan..." : "Simpan Perubahan Galeri"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!photoToDelete} onOpenChange={(open) => !open && setPhotoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Foto</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus foto ini dari galeri?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (photoToDelete) removePhoto(photoToDelete);
              }}
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
