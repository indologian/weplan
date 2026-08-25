"use server";

import { ZodError } from "zod";
import { ensureUserProfile } from "@/modules/auth/server/ensure-user-profile";
import { AuthenticationError, requireUser } from "@/modules/auth/server/require-user";
import type { ActionResult } from "@/shared/types/action-result";
import { invitationCreateOrSyncSchema } from "../schemas";
import type { CreatedInvitation } from "../types";
import { createOrSyncAtomic, InvitationCreationError } from "./repository";

export async function createOrSyncInvitation(input: unknown): Promise<ActionResult<CreatedInvitation>> {
  try {
    const user = await requireUser();
    await ensureUserProfile(user);
    const validated = invitationCreateOrSyncSchema.parse(input);
    return { success: true, data: await createOrSyncAtomic(user.id, validated) };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        code: "VALIDATION_ERROR",
        error: "Periksa kembali data undangan.",
        fieldErrors: error.flatten().fieldErrors,
      };
    }
    if (error instanceof AuthenticationError) {
      return { success: false, code: "FORBIDDEN", error: "Silakan masuk untuk melanjutkan." };
    }
    if (error instanceof InvitationCreationError) {
      const code = error.kind === "CONFLICT"
        ? "INVALID_STATE"
        : error.kind === "NOT_FOUND"
          ? "NOT_FOUND"
          : "TEMPORARY_ERROR";
      return { success: false, code, error: "Undangan belum dapat dibuat. Silakan coba kembali." };
    }
    return { success: false, code: "TEMPORARY_ERROR", error: "Layanan sementara tidak tersedia." };
  }
}
