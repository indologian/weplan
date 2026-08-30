"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { actionEvaluatePublishReadiness } from "../../server/actions";
import type { PublishReadinessResult } from "../../publish-readiness";
import { useEditorWorkspace } from "./editor-workspace-context";

export function EditorPublishReadiness({ invitationId }: { invitationId: string }) {
  const { contentVersion, globalSaveState } = useEditorWorkspace();
  const [readiness, setReadiness] = useState<PublishReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch when saved
    if (globalSaveState !== "saved") return;

    let mounted = true;
    const fetchReadiness = async () => {
      setLoading(true);
      const res = await actionEvaluatePublishReadiness(invitationId);
      if (mounted && res.success) {
        setReadiness(res.data);
      }
      if (mounted) {
        setLoading(false);
      }
    };
    void fetchReadiness();
    
    return () => { mounted = false; };
  }, [invitationId, contentVersion, globalSaveState]);

  if (!readiness && loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground bg-muted/30 rounded-lg">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Memeriksa kelengkapan undangan...
      </div>
    );
  }

  if (!readiness) return null;

  return (
    <div className="space-y-4 pt-8">
      <h2 className="text-lg font-semibold tracking-tight">Kelengkapan Undangan</h2>
      
      {readiness.isReady ? (
        <div className="flex items-center gap-3 p-4 bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-900/50">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Undangan Anda sudah lengkap dan siap untuk di-publish.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-orange-50 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 rounded-lg border border-orange-200 dark:border-orange-900/50">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">Ada {readiness.issues.length} hal yang perlu dilengkapi sebelum publish.</p>
          </div>
          
          <ul className="space-y-2">
            {readiness.issues.map((issue, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground bg-card p-3 rounded-md border">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
