import "server-only";

import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import type { CurrentUserProfile } from "../types";

export class AuthorizationError extends Error {
  constructor(message = "Operation is not allowed") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireActiveUserProfile(userId: string): Promise<CurrentUserProfile> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id,email,role,auth_context_version,is_blocked,account_status")
    .eq("id", userId)
    .single();

  if (error || !data || data.is_blocked || data.account_status !== "active") {
    throw new AuthorizationError();
  }

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    authContextVersion: data.auth_context_version,
    isBlocked: data.is_blocked,
    accountStatus: data.account_status,
  } as CurrentUserProfile;
}

export async function requireCurrentRole(
  userId: string,
  allowedRoles: ReadonlySet<CurrentUserProfile["role"]>,
): Promise<CurrentUserProfile> {
  const profile = await requireActiveUserProfile(userId);
  if (!allowedRoles.has(profile.role)) throw new AuthorizationError();
  return profile;
}

export async function requireInvitationOwnership(
  userId: string,
  invitationId: string,
): Promise<{ id: string; userId: string; status: "draft" | "published" | "expired" | "trashed"; contentVersion: number }> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("id,user_id,status,content_version")
    .eq("id", invitationId)
    .eq("user_id", userId)
    .single();

  if (error || !data) throw new AuthorizationError();
  return {
    id: data.id,
    userId: data.user_id,
    status: data.status,
    contentVersion: data.content_version,
  } as { id: string; userId: string; status: "draft" | "published" | "expired" | "trashed"; contentVersion: number };
}
