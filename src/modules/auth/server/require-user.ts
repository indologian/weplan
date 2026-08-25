import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server-client";

export class AuthenticationError extends Error {
  constructor() {
    super("Authentication is required");
    this.name = "AuthenticationError";
  }
}

export async function requireUser(): Promise<User> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new AuthenticationError();
  return data.user;
}
