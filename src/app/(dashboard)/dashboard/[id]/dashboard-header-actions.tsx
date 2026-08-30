"use client";

import { useState } from "react";
import { ThemeChangerModal } from "../../_components/theme-changer-modal";
import { CheckoutButton } from "./checkout-button";
import { Button } from "@/shared/components/ui/button";
import { useEditorWorkspace } from "@/modules/invitation/components/editor/editor-workspace-context";
import { EditorSaveStatus } from "@/modules/invitation/components/editor/editor-save-status";

type ThemeOption = {
  id: string;
  name: string;
  thumbnail_url: string | null;
  category: string;
};

export function DashboardHeaderActions({
  invitation,
  themes,
  updateTheme,
}: {
  invitation: { invitationId: string; themeId: string; slug: string; status: string };
  themes: ThemeOption[];
  updateTheme: any;
}) {
  const { contentVersion, flushAll } = useEditorWorkspace();
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handlePreview = async () => {
    setIsPreviewing(true);
    const result = await flushAll();
    setIsPreviewing(false);
    if (result.success) {
      window.open(`/preview/${invitation.invitationId}`, "_blank");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <EditorSaveStatus />
      <ThemeChangerModal 
        invitationId={invitation.invitationId} 
        currentThemeId={invitation.themeId}
        expectedVersion={contentVersion}
        themes={themes}
        updateTheme={updateTheme}
        onBeforeChange={async () => (await flushAll()).success}
      />
      
      <Button
        variant="outline"
        className="text-sm font-medium border rounded-md px-4 py-2 hover:bg-muted"
        onClick={() => void handlePreview()}
        disabled={isPreviewing}
      >
        {isPreviewing ? "Menyimpan..." : "Preview"}
      </Button>

      {invitation.status === "published" ? (
        <a
          href={`/${invitation.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium bg-primary text-primary-foreground rounded-md px-4 py-2 hover:opacity-90"
        >
          Buka Halaman Publik
        </a>
      ) : (
        <CheckoutButton invitationId={invitation.invitationId} />
      )}
    </div>
  );
}
