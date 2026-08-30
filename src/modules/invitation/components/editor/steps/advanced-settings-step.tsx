"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { MediaUploader } from "@/modules/storage/components/media-uploader";
import { SensitiveAuthForm } from "@/modules/auth/components/sensitive-auth-form";
import { AutosaveQueue, type AutosaveResult } from "../../../autosave-queue";
import { useEditorWorkspace } from "../editor-workspace-context";
import type { EditorDTO, SaveEditorContentAction, UpdateEditorPrivacyAction } from "../../../types";
import type { IssueSensitiveAuthAction } from "@/modules/auth/types";

type AdvancedSettingsForm = {
  backgroundAudioMediaId: string;
  videoEmbedId: string;
};

export function AdvancedSettingsStep({
  initialData,
  saveEditorContent,
  issueSensitiveAuth,
  updateEditorPrivacy,
}: {
  initialData: EditorDTO;
  saveEditorContent: SaveEditorContentAction;
  issueSensitiveAuth: IssueSensitiveAuthAction;
  updateEditorPrivacy: UpdateEditorPrivacyAction;
}) {
  const { contentVersion, setContentVersion, registerFlushCallback, unregisterFlushCallback, saveState, setSaveState, setConflictState } = useEditorWorkspace();

  // --- Audio / Video Logic (Autosaved) ---
  const { control, register, setValue } = useForm<AdvancedSettingsForm>({
    defaultValues: {
      backgroundAudioMediaId: initialData.settings.backgroundAudioMediaId ?? "",
      videoEmbedId: initialData.settings.videoEmbeds?.[0]?.externalId ?? "",
    },
  });

  const [autosaveQueue] = useState(
    () =>
      new AutosaveQueue<AdvancedSettingsForm>(
        contentVersion,
        async (snapshot, expectedVersion): Promise<AutosaveResult> => {
          const result = await saveEditorContent({
            invitationId: initialData.invitationId,
            expectedVersion,
            settings: {
              ...initialData.settings,
              ...(snapshot.backgroundAudioMediaId ? { backgroundAudioMediaId: snapshot.backgroundAudioMediaId } : {}),
              ...(snapshot.videoEmbedId && snapshot.videoEmbedId.length === 11 ? { videoEmbeds: [{ id: crypto.randomUUID(), kind: "video", provider: "youtube", externalId: snapshot.videoEmbedId }] } : {}),
            },
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

  const backgroundAudioMediaId = useWatch({ control, name: "backgroundAudioMediaId" }) ?? "";
  const videoEmbedId = useWatch({ control, name: "videoEmbedId" }) ?? "";

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
    registerFlushCallback("settings", flushSaveQueue);
    return () => unregisterFlushCallback("settings");
  }, [registerFlushCallback, unregisterFlushCallback, flushSaveQueue]);

  useEffect(() => {
    autosaveQueue.adoptServerVersion(contentVersion);
  }, [contentVersion, autosaveQueue]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    const generation = autosaveQueue.markDirty({
      backgroundAudioMediaId,
      videoEmbedId,
    });
    setLocalEditGeneration(generation);
    setSaveState("dirty");
  }, [autosaveQueue, backgroundAudioMediaId, videoEmbedId, setSaveState]);

  useEffect(() => {
    if (localEditGeneration === 0 || saveState === "conflict") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flushSaveQueue(), 1000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [flushSaveQueue, localEditGeneration, saveState]);


  // --- Privacy Logic (Dedicated Mutation) ---
  const [isPrivate, setIsPrivate] = useState(initialData.isPrivate);
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [privacyMessage, setPrivacyMessage] = useState("");
  const [privacyPending, setPrivacyPending] = useState(false);

  const updatePrivacy = async () => {
    setPrivacyPending(true);
    // Ensure all other settings are flushed first before this sensitive CAS operation
    await flushSaveQueue();

    const result = await updateEditorPrivacy({
      invitationId: initialData.invitationId,
      expectedVersion: contentVersion,
      isPrivate,
      ...(pin ? { pin } : {}),
    });
    setPrivacyPending(false);
    
    if (!result.success) {
      setPrivacyMessage(result.error);
      return;
    }
    
    setPin("");
    setAuthenticated(false);
    setContentVersion(result.data.contentVersion);
    setPrivacyMessage("Pengaturan privasi tersimpan.");
    toast.success("Pengaturan privasi tersimpan!");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Media</CardTitle>
          <CardDescription>Tambahkan musik latar dan sematkan video YouTube.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Audio Latar Belakang (BGM)</Label>
            <MediaUploader
              invitationId={initialData.invitationId}
              kind="audio"
              purpose="background_audio"
              label="Upload Musik (MP3)"
              currentMediaId={backgroundAudioMediaId}
              onSuccess={(mediaId) => setValue("backgroundAudioMediaId", mediaId, { shouldDirty: true })}
            />
            <p className="text-xs text-muted-foreground mt-1">Gunakan file MP3 maksimal 5MB.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoEmbedId">Video YouTube (ID)</Label>
            <Input 
              id="videoEmbedId" 
              {...register("videoEmbedId", {
                onChange: (e) => {
                  const val = e.target.value;
                  const match = val.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
                  if (match && match[1]) {
                    e.target.value = match[1];
                    setValue("videoEmbedId", match[1], { shouldDirty: true });
                  }
                }
              })} 
              placeholder="Contoh: dQw4w9WgXcQ (ID atau Link)" 
            />
            <p className="text-xs text-muted-foreground mt-1">Masukkan ID video (11 karakter).</p>
            {videoEmbedId && videoEmbedId.length === 11 && (
              <div className="mt-3 relative w-full aspect-video rounded-lg overflow-hidden border">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube-nocookie.com/embed/${videoEmbedId}`} 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privasi & Keamanan</CardTitle>
          <CardDescription>Atur siapa saja yang dapat mengakses undangan Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-3">
            <input
              id="isPrivate"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={isPrivate}
              onChange={(event) => {
                setIsPrivate(event.target.checked);
                setAuthenticated(false);
              }}
            />
            <Label htmlFor="isPrivate" className="font-medium">
              Gunakan PIN Keamanan
            </Label>
          </div>

          {isPrivate && (
            <div className="space-y-2 border-l-2 border-muted pl-4 ml-1">
              <Label htmlFor="pin">PIN Baru (Opsional jika menggunakan PIN lama)</Label>
              <Input
                id="pin"
                type="password"
                className="max-w-xs"
                value={pin}
                inputMode="numeric"
                autoComplete="new-password"
                placeholder="Contoh: 123456"
                onChange={(event) => setPin(event.target.value)}
              />
            </div>
          )}

          {privacyMessage && (
            <p className="text-sm font-medium text-green-600" aria-live="polite">{privacyMessage}</p>
          )}

          <div className="pt-4 border-t">
            {!authenticated ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Verifikasi password Anda untuk mengubah pengaturan keamanan ini.</p>
                <SensitiveAuthForm
                  issueSensitiveAuth={issueSensitiveAuth}
                  onAuthenticated={() => setAuthenticated(true)}
                />
              </div>
            ) : (
              <Button
                type="button"
                disabled={privacyPending}
                onClick={() => void updatePrivacy()}
              >
                {privacyPending ? "Menyimpan..." : "Simpan Pengaturan Privasi"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
