"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/modules/auth/server/require-user";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import type { ActionResult } from "@/shared/types/action-result";
import { createGuestToken, hashGuestToken } from "./token";
import type { GuestManagementDTO } from "../types";

const SECRET = process.env.GUEST_TOKEN_HMAC_SECRET ?? "";
const guestSchema = z.object({
  invitationId: z.string().uuid(), guestId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160), phone: z.string().trim().max(30).optional(),
  title: z.string().trim().max(80).optional(), groupName: z.string().trim().max(100).optional(),
  rsvpStatus: z.enum(["pending", "confirmed", "declined"]), attendance: z.number().int().min(0).max(10),
}).strict().superRefine((v, ctx) => {
  if (v.rsvpStatus === "declined" && v.attendance !== 0) ctx.addIssue({ code: "custom", path: ["attendance"], message: "Tamu yang tidak hadir harus berjumlah 0." });
  if (v.rsvpStatus !== "declined" && v.attendance < 1) ctx.addIssue({ code: "custom", path: ["attendance"], message: "Jumlah tamu minimal 1." });
});
const targetSchema = z.object({ invitationId: z.string().uuid(), guestId: z.string().uuid() }).strict();

async function owns(userId: string, invitationId: string) {
  const db = createSupabaseServiceClient();
  const { data } = await db.from("invitations").select("id").eq("id", invitationId).eq("user_id", userId).maybeSingle();
  return Boolean(data);
}
function normalizePhone(value?: string) { const v = value?.replace(/\D/g, "") ?? ""; return v || null; }
function failure(error: unknown): ActionResult<never> {
  if (error instanceof z.ZodError) return { success: false, code: "VALIDATION_ERROR", error: error.issues[0]?.message ?? "Data tamu tidak valid." };
  return { success: false, code: "TEMPORARY_ERROR", error: error instanceof Error ? error.message : "Operasi tamu gagal." };
}

export async function getManagedGuests(userId: string, invitationId: string): Promise<GuestManagementDTO[]> {
  if (!await owns(userId, invitationId)) return [];
  const { data, error } = await createSupabaseServiceClient().from("guests")
    .select("id,name,phone,title,group_name,guest_source,rsvp_status,attendance,wish_message,wish_status,is_wa_sent")
    .eq("invitation_id", invitationId).order("created_at", { ascending: false });
  if (error) throw new Error("Daftar tamu tidak dapat dimuat.");
  return (data ?? []).map((g) => ({ id:g.id, name:g.name, phone:g.phone, title:g.title, groupName:g.group_name,
    source:g.guest_source, rsvpStatus:g.rsvp_status, attendance:g.attendance, wishMessage:g.wish_message,
    wishStatus:g.wish_status, isWaSent:g.is_wa_sent })) as GuestManagementDTO[];
}

export async function actionSaveGuest(input: unknown): Promise<ActionResult<{ guestId: string }>> {
  try {
    const user = await requireUser(); const v = guestSchema.parse(input);
    if (!await owns(user.id, v.invitationId)) return { success:false, code:"FORBIDDEN", error:"Undangan tidak ditemukan." };
    const db = createSupabaseServiceClient(); const payload = { name:v.name, phone:v.phone || null, normalized_phone:normalizePhone(v.phone), title:v.title || null,
      group_name:v.groupName || null, rsvp_status:v.rsvpStatus, attendance:v.rsvpStatus === "declined" ? 0 : v.attendance, updated_at:new Date().toISOString() };
    const query = v.guestId
      ? db.from("guests").update(payload).eq("id", v.guestId).eq("invitation_id", v.invitationId).select("id").single()
      : db.from("guests").insert({ ...payload, invitation_id:v.invitationId, guest_source:"manual" }).select("id").single();
    const { data, error } = await query; if (error) throw new Error(error.code === "23505" ? "Nomor WhatsApp sudah dipakai tamu lain." : "Tamu tidak dapat disimpan.");
    revalidatePath(`/dashboard/${v.invitationId}/tamu`); return { success:true, data:{ guestId:data.id } };
  } catch (e) { return failure(e); }
}

export async function actionDeleteGuest(input: unknown): Promise<ActionResult> {
  try { const user=await requireUser(); const v=targetSchema.parse(input); if(!await owns(user.id,v.invitationId)) return {success:false,code:"FORBIDDEN",error:"Undangan tidak ditemukan."};
    const { error }=await createSupabaseServiceClient().from("guests").delete().eq("id",v.guestId).eq("invitation_id",v.invitationId); if(error) throw new Error("Tamu tidak dapat dihapus.");
    revalidatePath(`/dashboard/${v.invitationId}/tamu`); return {success:true,data:undefined}; } catch(e){return failure(e);}
}

export async function actionModerateWish(input: unknown): Promise<ActionResult> {
  try { const user=await requireUser(); const v=targetSchema.extend({status:z.enum(["approved","hidden","rejected"])}).parse(input); if(!await owns(user.id,v.invitationId)) return {success:false,code:"FORBIDDEN",error:"Undangan tidak ditemukan."};
    const {error}=await createSupabaseServiceClient().from("guests").update({wish_status:v.status,updated_at:new Date().toISOString()}).eq("id",v.guestId).eq("invitation_id",v.invitationId); if(error) throw new Error("Status ucapan gagal disimpan.");
    revalidatePath(`/dashboard/${v.invitationId}/tamu`); return {success:true,data:undefined}; } catch(e){return failure(e);}
}

export async function actionGenerateGuestLink(input: unknown): Promise<ActionResult<{ url:string }>> {
  try { const user=await requireUser(); const v=targetSchema.parse(input); if(!SECRET) throw new Error("Konfigurasi token tamu belum tersedia."); if(!await owns(user.id,v.invitationId)) return {success:false,code:"FORBIDDEN",error:"Undangan tidak ditemukan."};
    const db=createSupabaseServiceClient(); const [{data:g},{data:invitation}]=await Promise.all([db.from("guests").select("id").eq("id",v.guestId).eq("invitation_id",v.invitationId).single(),db.from("invitations").select("slug").eq("id",v.invitationId).eq("user_id",user.id).single()]); if(!g||!invitation) return {success:false,code:"NOT_FOUND",error:"Tamu tidak ditemukan."};
    const token=createGuestToken(); const {error}=await db.from("guest_credentials").upsert({guest_id:v.guestId,access_token_hash:hashGuestToken(token,SECRET),token_created_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:"guest_id"}); if(error) throw new Error("Tautan personal gagal dibuat.");
    const base=(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/,"");
    return {success:true,data:{url:`${base}/${invitation.slug}?guest=${token}`}}; } catch(e){return failure(e);}
}

export async function actionMarkWaSent(input: unknown): Promise<ActionResult> {
  try { const user=await requireUser(); const v=targetSchema.parse(input); if(!await owns(user.id,v.invitationId)) return {success:false,code:"FORBIDDEN",error:"Undangan tidak ditemukan."};
    await createSupabaseServiceClient().from("guests").update({is_wa_sent:true,updated_at:new Date().toISOString()}).eq("id",v.guestId).eq("invitation_id",v.invitationId); revalidatePath(`/dashboard/${v.invitationId}/tamu`); return {success:true,data:undefined}; } catch(e){return failure(e);}
}
