"use server";

import { ZodError } from "zod";
import { AuthorizationError } from "@/modules/auth/server/authorization";
import { ensureUserProfile } from "@/modules/auth/server/ensure-user-profile";
import { AuthenticationError, requireUser } from "@/modules/auth/server/require-user";
import {
  requireSensitiveAuthentication,
  SensitiveAuthenticationError,
} from "@/modules/auth/server/require-sensitive-auth";
import type { ActionResult } from "@/shared/types/action-result";
import {
  editorContentAutosaveSchema,
  editorEventDeleteSchema,
  editorEventReorderSchema,
  editorEventSaveSchema,
  editorUpdatePrivacySchema,
  editorUpdateRsvpConfigSchema,
  editorUpdateThemeSchema,
  invitationCreateOrSyncSchema,
} from "../schemas";
import type { CreatedInvitation } from "../types";
import { hashPinWithHistoryCheck, PinCryptoError } from "./pin-crypto";
import {
  createOrSyncAtomic,
  deleteEditorEvent,
  EditorMutationError,
  getPinCredentialContext,
  InvitationCreationError,
  reorderEditorEvents,
  saveEditorContent,
  saveEditorEvent,
  updateEditorPrivacy,
  updateEditorRsvpConfig,
  updateEditorTheme,
} from "./repository";

function handleEditorError(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      error: "Periksa kembali data masukan.",
      fieldErrors: error.flatten().fieldErrors,
    };
  }
  if (
    error instanceof AuthenticationError
    || error instanceof AuthorizationError
    || error instanceof SensitiveAuthenticationError
  ) {
    return { success: false, code: "FORBIDDEN", error: "Autentikasi tidak cukup untuk tindakan ini." };
  }
  if (error instanceof EditorMutationError) {
    return {
      success: false,
      code: error.kind,
      error: error.kind === "VERSION_CONFLICT"
        ? "Perubahan tidak dapat disimpan karena ada versi lebih baru."
        : "Gagal menyimpan perubahan.",
      ...(error.serverVersion === undefined ? {} : { serverVersion: error.serverVersion }),
    };
  }
  if (error instanceof PinCryptoError) {
    return { success: false, code: "TEMPORARY_ERROR", error: "Layanan PIN sementara tidak tersedia." };
  }
  return { success: false, code: "TEMPORARY_ERROR", error: "Layanan sementara tidak tersedia." };
}

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

export async function actionSaveEditorContent(
  input: unknown,
): Promise<ActionResult<{ contentVersion: number }>> {
  try {
    const user = await requireUser();
    const validated = editorContentAutosaveSchema.parse(input);
    const contentVersion = await saveEditorContent(user.id, validated);
    return { success: true, data: { contentVersion } };
  } catch (error) {
    return handleEditorError(error);
  }
}

export async function actionUpdateEditorTheme(
  input: unknown,
): Promise<ActionResult<{ contentVersion: number }>> {
  try {
    const user = await requireUser();
    const validated = editorUpdateThemeSchema.parse(input);
    const contentVersion = await updateEditorTheme(user.id, validated);
    return { success: true, data: { contentVersion } };
  } catch (error) {
    return handleEditorError(error);
  }
}

export async function actionUpdateEditorPrivacy(
  input: unknown,
): Promise<ActionResult<{ contentVersion: number }>> {
  try {
    const user = await requireUser();
    const validated = editorUpdatePrivacySchema.parse(input);
    await requireSensitiveAuthentication(user.id);

    const pinContext = await getPinCredentialContext(user.id, validated.invitationId);
    if (pinContext.contentVersion !== validated.expectedVersion) {
      throw new EditorMutationError(
        "Stale content version",
        "VERSION_CONFLICT",
        pinContext.contentVersion,
      );
    }

    if (validated.isPrivate && !validated.pin && !pinContext.hasCurrentPin) {
      return {
        success: false,
        code: "VALIDATION_ERROR",
        error: "PIN diperlukan untuk mengaktifkan mode private.",
        fieldErrors: { pin: ["Buat PIN 6–10 digit sebelum mengaktifkan mode private."] },
      };
    }

    let pinHash: string | undefined;
    if (validated.pin) {
      const result = await hashPinWithHistoryCheck(validated.pin, pinContext.comparisonHashes);
      if (result.reused) {
        return {
          success: false,
          code: "VALIDATION_ERROR",
          error: "PIN baru tidak boleh sama dengan PIN sebelumnya.",
          fieldErrors: { pin: ["Gunakan PIN yang berbeda dari PIN saat ini dan tiga PIN terakhir."] },
        };
      }
      pinHash = result.hash;
    }

    const contentVersion = await updateEditorPrivacy(user.id, validated, pinHash);
    return { success: true, data: { contentVersion } };
  } catch (error) {
    return handleEditorError(error);
  }
}

export async function actionUpdateEditorRsvpConfig(
  input: unknown,
): Promise<ActionResult<{ contentVersion: number }>> {
  try {
    const user = await requireUser();
    const validated = editorUpdateRsvpConfigSchema.parse(input);
    const contentVersion = await updateEditorRsvpConfig(user.id, validated);
    return { success: true, data: { contentVersion } };
  } catch (error) {
    return handleEditorError(error);
  }
}

export async function actionSaveEditorEvent(
  input: unknown,
): Promise<ActionResult<{ contentVersion: number; eventId: string }>> {
  try {
    const user = await requireUser();
    const validated = editorEventSaveSchema.parse(input);
    return { success: true, data: await saveEditorEvent(user.id, validated) };
  } catch (error) {
    return handleEditorError(error);
  }
}

export async function actionDeleteEditorEvent(
  input: unknown,
): Promise<ActionResult<{ contentVersion: number }>> {
  try {
    const user = await requireUser();
    const validated = editorEventDeleteSchema.parse(input);
    const contentVersion = await deleteEditorEvent(user.id, validated);
    return { success: true, data: { contentVersion } };
  } catch (error) {
    return handleEditorError(error);
  }
}

export async function actionReorderEditorEvents(
  input: unknown,
): Promise<ActionResult<{ contentVersion: number }>> {
  try {
    const user = await requireUser();
    const validated = editorEventReorderSchema.parse(input);
    const contentVersion = await reorderEditorEvents(user.id, validated);
    return { success: true, data: { contentVersion } };
  } catch (error) {
    return handleEditorError(error);
  }
}

export async function actionCheckSlugAvailability(slug: string, currentInvitationId: string): Promise<boolean> {
  const { createSupabaseServiceClient } = await import("@/shared/lib/supabase/service-client");
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase.from("invitations").select("id").eq("slug", slug).maybeSingle();
  if (!data) return true;
  return data.id === currentInvitationId;
}

export async function actionUpdateEditorSlug(input: unknown): Promise<ActionResult<{ slug: string }>> {
  try {
    const user = await requireUser();
    const schema = (await import("zod")).z.object({
      invitationId: (await import("zod")).z.string(),
      slug: (await import("zod")).z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Hanya huruf kecil, angka, dan strip yang diperbolehkan")
    });
    const validated = schema.parse(input);
    
    const isAvailable = await actionCheckSlugAvailability(validated.slug, validated.invitationId);
    if (!isAvailable) {
      return { success: false, error: "Slug sudah digunakan", code: "VALIDATION_ERROR" };
    }

    const { createSupabaseServiceClient } = await import("@/shared/lib/supabase/service-client");
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase
      .from("invitations")
      .update({ slug: validated.slug })
      .eq("id", validated.invitationId)
      .eq("user_id", user.id);
    
    if (error) {
      if (error.code === '23505') {
        return { success: false, error: "Slug sudah digunakan", code: "VALIDATION_ERROR" };
      }
      throw error;
    }
    
    return { success: true, data: { slug: validated.slug } };
  } catch (error) {
    return handleEditorError(error);
  }
}
