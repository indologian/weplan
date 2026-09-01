import "server-only";

import type { User } from "@supabase/supabase-js";
import { getOptionalUser } from "./get-optional-user";

export class AuthenticationError extends Error {
  constructor() {
    super("Authentication is required");
    this.name = "AuthenticationError";
  }
}

export async function requireUser(): Promise<User> {
  const user = await getOptionalUser();
  if (!user) throw new AuthenticationError();
  return user;
}
