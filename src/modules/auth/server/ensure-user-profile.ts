import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";

export class ProfileProvisioningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileProvisioningError";
  }
}

function optionalMetadataString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function ensureUserProfile(user: User): Promise<void> {
  if (!user.email) throw new ProfileProvisioningError("Verified user email is required");

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("user_profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: optionalMetadataString(user.user_metadata.full_name) ?? "",
      avatar_url: optionalMetadataString(user.user_metadata.avatar_url),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) throw new ProfileProvisioningError("Unable to provision user profile");
}
