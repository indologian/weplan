"use client";

import { createContext, useContext } from "react";

export type InvitationPhase = "closed" | "opening" | "open";

type InvitationExperienceValue = {
  phase: InvitationPhase;
};

const InvitationExperienceContext = createContext<InvitationExperienceValue | null>(null);

export function InvitationExperienceProvider({
  children,
  phase,
}: {
  children: React.ReactNode;
  phase: InvitationPhase;
}) {
  return (
    <InvitationExperienceContext.Provider value={{ phase }}>
      {children}
    </InvitationExperienceContext.Provider>
  );
}

export function useInvitationExperience() {
  const context = useContext(InvitationExperienceContext);
  if (!context) {
    throw new Error("useInvitationExperience must be used within an InvitationExperienceProvider");
  }
  return context;
}

