import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/shared/lib/env/server";

export function createSupabaseServiceClient() {
  const env = getServerEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
