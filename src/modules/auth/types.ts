import type { ActionResult } from "@/shared/types/action-result";

export type CurrentUserProfile = {
  id: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  authContextVersion: number;
  isBlocked: boolean;
  accountStatus: "active" | "pending_deletion" | "deleting";
};

export type IssueSensitiveAuthAction = (
  input: unknown,
) => Promise<ActionResult<{ expiresAt: string }>>;
