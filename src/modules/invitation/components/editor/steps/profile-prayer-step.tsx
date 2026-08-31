"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { MediaUploader } from "@/modules/storage/components/media-uploader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shared/components/ui/alert-dialog";
import { AutosaveQueue, type AutosaveResult } from "../../../autosave-queue";
import { useEditorWorkspace } from "../editor-workspace-context";
import type { EditorDTO, SaveEditorContentAction } from "../../../types";

const OPENING_TEMPLATES = [
  { label: "Formal", value: "Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan acara pernikahan putra-putri kami:" },
  { label: "Hangat", value: "Dengan penuh rasa syukur dan sukacita, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk hadir pada acara pernikahan kami:" },
  { label: "Santai", value: "Tanpa mengurangi rasa hormat, kami mengundang teman-teman sekalian untuk hadir dan merayakan hari bahagia pernikahan kami:" },
  { label: "Kristen/Katolik", value: "Dalam kasih karunia Tuhan, kami bermaksud menyelenggarakan pemberkatan dan perayaan pernikahan putra-putri kami:" }
];

const QUOTE_TEMPLATES = [
  { label: "Islami", value: '"Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya diantaramu rasa kasih dan sayang. Sesungguhnya pada yang demikian itu benar-benar terdapat tanda-tanda bagi kaum yang berfikir." (QS. Ar-Rum: 21)' },
  { label: "Kristen", value: '"Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia." (Matius 19:6)' },
  { label: "Katolik", value: '"Cinta itu sabar; cinta itu murah hati; ia tidak cemburu. Ia tidak memegahkan diri dan tidak sombong." (1 Korintus 13:4)' },
  { label: "Umum / Romantis", value: '"Dua jiwa namun satu pikiran, dua hati namun satu perasaan."' }
];

type ProfilePrayerForm = {
  groomParentNames: string;
  brideParentNames: string;
  groomName: string;
  brideName: string;
  groomPhotoMediaId: string;
  bridePhotoMediaId: string;
  openingText: string;
  quoteText: string;
};

export function ProfilePrayerStep({
  initialData,
  saveEditorContent,
}: {
  initialData: EditorDTO;
  saveEditorContent: SaveEditorContentAction;
}) {
  const { contentVersion, commitRevision, registerSection, unregisterSection, setSectionState, setConflictState } = useEditorWorkspace();

  const { control, register, setValue } = useForm<ProfilePrayerForm>({
    defaultValues: {
      groomName: initialData.couple.groom?.name ?? "",
      groomParentNames: initialData.couple.groom?.parentNames?.join(", ") ?? "",
      brideName: initialData.couple.bride?.name ?? "",
      brideParentNames: initialData.couple.bride?.parentNames?.join(", ") ?? "",
      groomPhotoMediaId: initialData.couple.groom?.photoMediaId ?? "",
      bridePhotoMediaId: initialData.couple.bride?.photoMediaId ?? "",
      openingText: initialData.settings.openingText ?? "",
      quoteText: initialData.settings.quoteText ?? "",
    },
  });

  const [autosaveQueue] = useState(
    () =>
      new AutosaveQueue<ProfilePrayerForm>(
        contentVersion,
        async (snapshot, expectedVersion): Promise<AutosaveResult> => {
          const result = await saveEditorContent({
            invitationId: initialData.invitationId,
            expectedVersion,
            couple: {
              ...initialData.couple,
              groom: { ...initialData.couple.groom, name: snapshot.groomName, parentNames: snapshot.groomParentNames.split(",").map(n => n.trim()).filter(Boolean), ...(snapshot.groomPhotoMediaId ? { photoMediaId: snapshot.groomPhotoMediaId } : {}) },
              bride: { ...initialData.couple.bride, name: snapshot.brideName, parentNames: snapshot.brideParentNames.split(",").map(n => n.trim()).filter(Boolean), ...(snapshot.bridePhotoMediaId ? { photoMediaId: snapshot.bridePhotoMediaId } : {}) },
            },
            settings: {
              openingText: snapshot.openingText,
              quoteText: snapshot.quoteText,
            },
          });
          if (result.success) {
            return {
              success: true,
              contentVersion: result.data.contentVersion,
            };
          }
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

  const groomName = useWatch({ control, name: "groomName" }) ?? "";
  const groomParentNames = useWatch({ control, name: "groomParentNames" }) ?? "";
  const brideParentNames = useWatch({ control, name: "brideParentNames" }) ?? "";
  const brideName = useWatch({ control, name: "brideName" }) ?? "";
  const openingText = useWatch({ control, name: "openingText" }) ?? "";
  const quoteText = useWatch({ control, name: "quoteText" }) ?? "";
  const groomPhotoMediaId = useWatch({ control, name: "groomPhotoMediaId" }) ?? "";
  const bridePhotoMediaId = useWatch({ control, name: "bridePhotoMediaId" }) ?? "";

  const [localEditGeneration, setLocalEditGeneration] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  const flushSaveQueue = useCallback(async (version: number) => {
    if (!autosaveQueue.state.pendingSave) return { success: true, version };
    setSectionState("profile-prayer", "saving");
    const result = await autosaveQueue.flush(version);
    if (!result) return { success: true, version };
    if (!result.success) {
      if (result.code === "VERSION_CONFLICT") {
        setConflictState(true);
        setSectionState("profile-prayer", "conflict");
      } else {
        setSectionState("profile-prayer", "error");
      }
      return { success: false as const, error: result.code };
    }
    if (result.contentVersion) {
      commitRevision(result.contentVersion);
    }
    setSectionState("profile-prayer", "saved");
    return { success: true as const, version: result.contentVersion };
  }, [autosaveQueue, commitRevision, setSectionState, setConflictState]);

  useEffect(() => {
    registerSection("profile-prayer", flushSaveQueue);
    return () => unregisterSection("profile-prayer");
  }, [registerSection, unregisterSection, flushSaveQueue]);

  useEffect(() => {
    autosaveQueue.adoptServerVersion(contentVersion);
  }, [contentVersion, autosaveQueue]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    const generation = autosaveQueue.markDirty({
      groomName,
      brideName,
      groomParentNames,
      brideParentNames,
      groomPhotoMediaId,
      bridePhotoMediaId,
      openingText,
      quoteText,
    });
    setLocalEditGeneration(generation);
    setSectionState("profile-prayer", "dirty");
  }, [autosaveQueue, groomName, brideName, groomParentNames, brideParentNames, groomPhotoMediaId, bridePhotoMediaId, openingText, quoteText, setSectionState]);

  useEffect(() => {
    if (localEditGeneration === 0) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flushSaveQueue(contentVersion), 1000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [flushSaveQueue, localEditGeneration, contentVersion]);

  const [templateConfirm, setTemplateConfirm] = useState<{ field: "openingText" | "quoteText", value: string } | null>(null);

  const applyTemplate = (field: "openingText" | "quoteText", value: string) => {
    const currentValue = field === "openingText" ? openingText : quoteText;
    if (currentValue.trim() && currentValue !== value) {
      setTemplateConfirm({ field, value });
      return;
    }
    setValue(field, value, { shouldDirty: true, shouldTouch: true });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Profil Mempelai</h2>
          <p className="text-sm text-muted-foreground">Masukkan nama panggilan atau nama pendek kedua mempelai.</p>
        </div>
        
        <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
          <div className="space-y-6">
            <h3 className="font-medium flex items-center gap-2 border-b pb-2">
              <span className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs">1</span>
              Mempelai Pria
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groomName">Nama Panggilan</Label>
                <Input id="groomName" {...register("groomName")} placeholder="Contoh: Romeo" className="max-w-xs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groomParentNames">Nama Orang Tua</Label>
                <Input id="groomParentNames" {...register("groomParentNames")} placeholder="Contoh: Bpk. X, Ibu Y" className="max-w-xs" />
              </div>
              <div className="space-y-2 pt-2">
                <Label>Foto Pria (Opsional)</Label>
                <MediaUploader
                  invitationId={initialData.invitationId}
                  kind="image"
                  purpose="couple_portrait"
                  label="Upload Foto"
                  currentMediaId={groomPhotoMediaId}
                  onSuccess={(mediaId) => setValue("groomPhotoMediaId", mediaId, { shouldDirty: true })}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="font-medium flex items-center gap-2 border-b pb-2">
              <span className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs">2</span>
              Mempelai Wanita
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brideName">Nama Panggilan</Label>
                <Input id="brideName" {...register("brideName")} placeholder="Contoh: Juliet" className="max-w-xs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brideParentNames">Nama Orang Tua</Label>
                <Input id="brideParentNames" {...register("brideParentNames")} placeholder="Contoh: Bpk. A, Ibu B" className="max-w-xs" />
              </div>
              <div className="space-y-2 pt-2">
                <Label>Foto Wanita (Opsional)</Label>
                <MediaUploader
                  invitationId={initialData.invitationId}
                  kind="image"
                  purpose="couple_portrait"
                  label="Upload Foto"
                  currentMediaId={bridePhotoMediaId}
                  onSuccess={(mediaId) => setValue("bridePhotoMediaId", mediaId, { shouldDirty: true })}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="my-10" />

      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Pembuka</h2>
          <p className="text-sm text-muted-foreground">Teks sambutan dan kutipan (doa/puisi) di bagian atas undangan.</p>
        </div>
        
        <div className="grid gap-10 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label htmlFor="openingText">Teks Sambutan</Label>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground self-center mr-1">Generator:</span>
                {OPENING_TEMPLATES.map((tmpl) => (
                  <Button 
                    key={tmpl.label} 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] uppercase tracking-wider"
                    onClick={() => applyTemplate("openingText", tmpl.value)}
                  >
                    {tmpl.label}
                  </Button>
                ))}
              </div>
            </div>
            <textarea 
              id="openingText" 
              className="flex min-h-[140px] w-full rounded-md border border-input bg-background/50 px-4 py-3 text-sm leading-relaxed shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              {...register("openingText")} 
              placeholder="Dengan memohon rahmat dan ridho Allah SWT..." 
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label htmlFor="quoteText">Kutipan / Doa</Label>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground self-center mr-1">Generator:</span>
                {QUOTE_TEMPLATES.map((tmpl) => (
                  <Button 
                    key={tmpl.label} 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] uppercase tracking-wider"
                    onClick={() => applyTemplate("quoteText", tmpl.value)}
                  >
                    {tmpl.label}
                  </Button>
                ))}
              </div>
            </div>
            <textarea 
              id="quoteText" 
              className="flex min-h-[140px] w-full rounded-md border border-input bg-background/50 px-4 py-3 text-sm leading-relaxed shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              {...register("quoteText")} 
              placeholder="Dan di antara tanda-tanda kekuasaan-Nya..." 
            />
          </div>
        </div>
      </section>

      <AlertDialog open={!!templateConfirm} onOpenChange={(open) => !open && setTemplateConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Timpa Teks Saat Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Teks yang sudah Anda ketik akan tertimpa dengan template baru. Anda yakin ingin melanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (templateConfirm) {
                  setValue(templateConfirm.field, templateConfirm.value, { shouldDirty: true, shouldTouch: true });
                  setTemplateConfirm(null);
                }
              }}
            >
              Ya, Timpa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
