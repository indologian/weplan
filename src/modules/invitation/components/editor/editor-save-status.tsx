"use client";

import { useEditorWorkspace } from "./editor-workspace-context";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export function EditorSaveStatus() {
  const { globalSaveState } = useEditorWorkspace();

  return (
    <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-full" aria-live="polite">
      {globalSaveState === "saving" && <><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /> <span className="text-muted-foreground font-medium hidden sm:inline">Menyimpan...</span></>}
      {globalSaveState === "saved" && <><CheckCircle2 className="h-4 w-4 text-green-600" /> <span className="text-muted-foreground font-medium hidden sm:inline">Tersimpan</span></>}
      {globalSaveState === "dirty" && <span className="text-muted-foreground font-medium italic hidden sm:inline">Ada perubahan...</span>}
      {globalSaveState === "error" && <><AlertCircle className="h-4 w-4 text-destructive" /> <span className="text-destructive font-medium hidden sm:inline">Gagal menyimpan</span></>}
      {globalSaveState === "conflict" && <><AlertCircle className="h-4 w-4 text-orange-500" /> <span className="text-orange-500 font-medium hidden sm:inline">Konflik</span></>}
    </div>
  );
}
