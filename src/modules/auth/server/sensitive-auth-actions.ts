"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { z, ZodError } from "zod";
import { requireUser } from "./require-user";
import { requireActiveUserProfile } from "./authorization";
import { getPublicEnv } from "@/shared/lib/env/public";
import { getSensitiveAuthHmacSecret } from "@/shared/lib/env/server";
import { signSensitiveAuthToken, SENSITIVE_AUTH_MAX_AGE_SECONDS } from "../sensitive-auth-token";
import type { ActionResult } from "@/shared/types/action-result";

const sensitiveReauthenticationSchema = z.object({
  password: z.string().min(1).max(1024),
}).strict();

export async function actionIssueSensitiveAuth(input: unknown): Promise<ActionResult<{ expiresAt: string }>> {
  try {
    const { password } = sensitiveReauthenticationSchema.parse(input);
    const user = await requireUser();
    if (!user.email) return { success: false, code: "FORBIDDEN", error: "Akun ini tidak dapat melakukan re-authentication password." };

    const env = getPublicEnv();
    const verifier = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    const { data, error } = await verifier.auth.signInWithPassword({ email: user.email, password });
    if (error || !data.user || data.user.id !== user.id) {
      return { success: false, code: "FORBIDDEN", error: "Re-authentication gagal." };
    }

    const profile = await requireActiveUserProfile(user.id);
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + SENSITIVE_AUTH_MAX_AGE_SECONDS;
    const token = await signSensitiveAuthToken({
      user_id: user.id,
      auth_context_version: profile.authContextVersion,
      issued_at: issuedAt,
      expires_at: expiresAt,
    }, getSensitiveAuthHmacSecret());

    const cookieStore = await cookies();
    cookieStore.set("sensitive_auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SENSITIVE_AUTH_MAX_AGE_SECONDS,
    });
    return { success: true, data: { expiresAt: new Date(expiresAt * 1000).toISOString() } };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, code: "VALIDATION_ERROR", error: "Masukkan password yang valid." };
    }
    return { success: false, code: "TEMPORARY_ERROR", error: "Re-authentication sementara tidak tersedia." };
  }
}