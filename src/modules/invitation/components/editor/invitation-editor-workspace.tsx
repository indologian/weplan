"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { AlertCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shared/components/ui/alert-dialog";
import type { EditorDTO, SaveEditorContentAction, SaveEditorEventAction, DeleteEditorEventAction, ReorderEditorEventsAction, ReplaceEditorGalleryAction, UpdateEditorPrivacyAction } from "../../types";
import type { IssueSensitiveAuthAction } from "@/modules/auth/types";
import { useEditorWorkspace } from "./editor-workspace-context";
import { EditorStepNavigation } from "./editor-step-navigation";
import { EditorPublishReadiness } from "./editor-publish-readiness";
import { ProfilePrayerStep } from "./steps/profile-prayer-step";
import { EventStep } from "./steps/event-step";
import { StoryGalleryStep } from "./steps/story-gallery-step";
import { AdvancedSettingsStep } from "./steps/advanced-settings-step";

type Props = {
  initialData: EditorDTO;
  saveEditorContent: SaveEditorContentAction;
  saveEditorEvent: SaveEditorEventAction;
  deleteEditorEvent: DeleteEditorEventAction;
  reorderEditorEvents: ReorderEditorEventsAction;
  replaceEditorGallery: ReplaceEditorGalleryAction;
  issueSensitiveAuth: IssueSensitiveAuthAction;
  updateEditorPrivacy: UpdateEditorPrivacyAction;
};

export function InvitationEditorWorkspace({
  initialData,
  saveEditorContent,
  saveEditorEvent,
  deleteEditorEvent,
  reorderEditorEvents,
  replaceEditorGallery,
  issueSensitiveAuth,
  updateEditorPrivacy,
}: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const { conflictState, flushAll } = useEditorWorkspace();

  const handleStepChange = async (step: number) => {
    setIsNavigating(true);
    const flushed = await flushAll();
    setIsNavigating(false);
    
    if (!flushed.success) {
      toast.error("Gagal menyimpan perubahan. Silakan periksa kembali data Anda.");
      return;
    }
    
    setCurrentStep(step);
  };

  return (
    <div className="space-y-6 pb-20">

      <AlertDialog open={conflictState}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Versi Undangan Berubah
            </AlertDialogTitle>
            <AlertDialogDescription>
              Undangan ini telah diubah di perangkat atau tab lain. Perubahan lokal Anda yang belum tersimpan akan dibuang. Anda dapat memuat versi terbaru untuk melihat perubahan tersebut.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {/* We provide a way to cancel just to dismiss, but they can't save anyway until they reload */}
            <AlertDialogCancel>Tutup Sementara</AlertDialogCancel>
            <AlertDialogAction onClick={() => window.location.reload()}>Muat Versi Terbaru</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditorStepNavigation currentStep={currentStep} onChange={handleStepChange} />

      <div className="mt-6">
        {currentStep === 1 && (
          <ProfilePrayerStep initialData={initialData} saveEditorContent={saveEditorContent} />
        )}
        {currentStep === 2 && (
          <EventStep 
            invitationId={initialData.invitationId} 
            initialEvents={initialData.events} 
            saveEditorEvent={saveEditorEvent}
            deleteEditorEvent={deleteEditorEvent}
            reorderEditorEvents={reorderEditorEvents}
          />
        )}
        {currentStep === 3 && (
          <StoryGalleryStep 
            invitationId={initialData.invitationId}
            initialData={initialData}
            saveEditorContent={saveEditorContent}
            replaceEditorGallery={replaceEditorGallery}
          />
        )}
        {currentStep === 4 && (
          <AdvancedSettingsStep 
            initialData={initialData}
            saveEditorContent={saveEditorContent}
            issueSensitiveAuth={issueSensitiveAuth}
            updateEditorPrivacy={updateEditorPrivacy}
          />
        )}
      </div>

      <div className="pt-8 flex justify-between items-center border-t">
        <Button variant="ghost" disabled={currentStep === 1 || isNavigating} onClick={() => void handleStepChange(currentStep - 1)}>
          Kembali
        </Button>
        <Button disabled={currentStep === 4 || isNavigating} onClick={() => void handleStepChange(currentStep + 1)}>
          {isNavigating ? "Menyimpan..." : "Lanjut"}
        </Button>
      </div>

      <EditorPublishReadiness invitationId={initialData.invitationId} />
    </div>
  );
}
