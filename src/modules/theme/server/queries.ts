import "server-only";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";

export type FeaturedThemeDTO = {
  id: string;
  name: string;
  code: string;
  description: string;
  thumbnail_url: string | null;
  is_premium: boolean;
};

export async function getFeaturedThemes(limit: number = 4): Promise<FeaturedThemeDTO[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("themes")
    .select("id, name, code, description, thumbnail_url, is_premium")
    .eq("is_active", true)
    .order("name")
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data;
}
