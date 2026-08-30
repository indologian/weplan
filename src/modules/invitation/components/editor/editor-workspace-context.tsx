"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from "react";

type FlushResult = { success: true; version?: number } | { success: false; error?: string };

type SectionState = "saved" | "dirty" | "saving" | "error" | "conflict";

type EditorWorkspaceContextType = {
  contentVersion: number;
  commitRevision: (version: number) => void;
  registerSection: (id: string, flushFn: (version: number) => Promise<FlushResult>) => void;
  unregisterSection: (id: string) => void;
  setSectionState: (id: string, state: SectionState) => void;
  flushAll: () => Promise<{ success: boolean; contentVersion: number; error?: string }>;
  conflictState: boolean;
  setConflictState: (hasConflict: boolean) => void;
  globalSaveState: SectionState;
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
  const [contentVersion, setContentVersionState] = useState(initialVersion);
  const contentVersionRef = useRef(initialVersion);
  
  const commitRevision = useCallback((version: number) => {
    if (version > contentVersionRef.current) {
      contentVersionRef.current = version;
      setContentVersionState(version);
    }
  }, []);

  const [conflictState, setConflictState] = useState(false);
  
  // Track individual section states
  const [sectionStates, setSectionStates] = useState<Record<string, SectionState>>({});
  
  const flushCallbacks = useRef<Map<string, (version: number) => Promise<FlushResult>>>(new Map());

  const registerSection = useCallback((id: string, flushFn: (version: number) => Promise<FlushResult>) => {
    flushCallbacks.current.set(id, flushFn);
    // Initialize "saved" only if section doesn't have a state yet
    setSectionStates(prev => (prev[id] !== undefined ? prev : { ...prev, [id]: "saved" }));
  }, []);

  const unregisterSection = useCallback((id: string) => {
    flushCallbacks.current.delete(id);
    setSectionStates(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const setSectionState = useCallback((id: string, state: SectionState) => {
    setSectionStates(prev => (prev[id] === state ? prev : { ...prev, [id]: state }));
  }, []);

  const isFlushing = useRef(false);
  const activeFlushPromise = useRef<Promise<{ success: boolean; contentVersion: number; error?: string }> | null>(null);

  const flushAll = useCallback(async () => {
    if (isFlushing.current && activeFlushPromise.current) {
      return activeFlushPromise.current;
    }
    
    isFlushing.current = true;
    const promise = (async () => {
      let currentVersion = contentVersionRef.current;
      
      for (const callback of Array.from(flushCallbacks.current.values())) {
        const result = await callback(currentVersion);
        
        if (!result.success) {
          if (result.error === "VERSION_CONFLICT") {
            setConflictState(true);
          }
          isFlushing.current = false;
          activeFlushPromise.current = null;
          return { success: false, contentVersion: currentVersion, error: result.error };
        }
        if (result.version) {
          currentVersion = Math.max(currentVersion, result.version);
        }
      }
      
      commitRevision(currentVersion);
      isFlushing.current = false;
      activeFlushPromise.current = null;
      return { success: true, contentVersion: currentVersion };
    })();
    
    activeFlushPromise.current = promise;
    return promise;
  }, [commitRevision]);

  // Derived global state
  let globalSaveState: SectionState = "saved";
  const states = Object.values(sectionStates);
  if (states.includes("conflict") || conflictState) globalSaveState = "conflict";
  else if (states.includes("error")) globalSaveState = "error";
  else if (states.includes("saving")) globalSaveState = "saving";
  else if (states.includes("dirty")) globalSaveState = "dirty";

  return (
    <EditorWorkspaceContext.Provider
      value={{
        contentVersion,
        commitRevision,
        registerSection,
        unregisterSection,
        setSectionState,
        flushAll,
        conflictState,
        setConflictState,
        globalSaveState,
      }}
    >
      {children}
    </EditorWorkspaceContext.Provider>
  );
}
