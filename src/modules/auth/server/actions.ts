"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server-client";

export async function actionLogout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
