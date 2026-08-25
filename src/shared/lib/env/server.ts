import "server-only";

import { z } from "zod";
import { parsePublicEnv } from "./public";

const serverSecretSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
});

export function getServerEnv() {
  return {
    ...parsePublicEnv({
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }),
    ...serverSecretSchema.parse({
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    }),
  };
}
