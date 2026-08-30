"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";

type EditorWorkspaceContextType = {
  contentVersion: number;
  setContentVersion: (version: number) => void;
  registerFlushCallback: (id: string, callback: () => Promise<{ success: boolean; version?: number; error?: string }>) => void;
  unregisterFlushCallback: (id: string) => void;
  flushAll: () => Promise<{ success: boolean; error?: string }>;
  conflictState: boolean;
  setConflictState: (hasConflict: boolean) => void;
  saveState: "saved" | "dirty" | "saving" | "error" | "conflict";
  setSaveState: (state: "saved" | "dirty" | "saving" | "error" | "conflict") => void;
};

const EditorWorkspaceContext = createContext<EditorWorkspaceContextType | null>(null);

export function useEditorWorkspace() {
  const context = useContext(EditorWorkspaceContext);
  if (!context) {
    throw new Error("useEditorWorkspace must be used within EditorWorkspaceProvider");
  }
  return context;
}

export function EditorWorkspaceProvider({
  children,
  initialVersion,
}: {
  children: ReactNode;
  initialVersion: number;
}) {
  const [contentVersion, setContentVersion] = useState(initialVersion);
  const [conflictState, setConflictState] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving" | "error" | "conflict">("saved");
  const flushCallbacks = useRef<Map<string, () => Promise<{ success: boolean; version?: number; error?: string }>>>(new Map());

  const registerFlushCallback = useCallback((id: string, callback: () => Promise<{ success: boolean; version?: number; error?: string }>) => {
    flushCallbacks.current.set(id, callback);
  }, []);

  const unregisterFlushCallback = useCallback((id: string) => {
    flushCallbacks.current.delete(id);
  }, []);

  const flushAll = useCallback(async () => {
    for (const [id, callback] of Array.from(flushCallbacks.current.entries())) {
      const result = await callback();
      if (!result.success) {
        if (result.error === "VERSION_CONFLICT") {
          setConflictState(true);
          setSaveState("conflict");
        } else {
          setSaveState("error");
        }
        return { success: false, error: result.error };
      }
      if (result.version) {
        setContentVersion(result.version);
      }
    }
    return { success: true };
  }, []);

  return (
    <EditorWorkspaceContext.Provider
      value={{
        contentVersion,
        setContentVersion,
        registerFlushCallback,
        unregisterFlushCallback,
        flushAll,
        conflictState,
        setConflictState,
        saveState,
        setSaveState,
      }}
    >
      {children}
    </EditorWorkspaceContext.Provider>
  );
}
