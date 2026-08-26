import "server-only";

import { cookies } from "next/headers";
import { getSensitiveAuthHmacSecret } from "@/shared/lib/env/server";
import { requireActiveUserProfile } from "./authorization";
import { verifySensitiveAuthToken } from "../sensitive-auth-token";

export class SensitiveAuthenticationError extends Error {
  constructor() {
    super("Valid sensitive authentication is required");
    this.name = "SensitiveAuthenticationError";
  }
}

export async function requireSensitiveAuthentication(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("sensitive_auth")?.value;
  if (!token) throw new SensitiveAuthenticationError();

  const profile = await requireActiveUserProfile(userId);
  const payload = await verifySensitiveAuthToken(token, getSensitiveAuthHmacSecret());
  if (!payload
    || payload.user_id !== userId
    || payload.auth_context_version !== profile.authContextVersion) {
    throw new SensitiveAuthenticationError();
  }
}
