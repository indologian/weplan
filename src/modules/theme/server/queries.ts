import "server-only";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";

export type FeaturedThemeDTO = {
  id: string;
  name: string;
  code: string;
  description: string;
  thumbnail_url: string | null;
  is_premium: boolean;
  category: string;
  price_amount: number;
};

export async function getFeaturedThemes(limit: number = 4): Promise<FeaturedThemeDTO[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("themes")
    .select("id, name, slug, description, preview_image, category, tiers!inner(code, price_amount)")
    .eq("is_active", true)
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((t: any) => ({
    id: t.id,
    name: t.name,
    code: t.slug,
    description: t.description,
    thumbnail_url: t.preview_image,
    is_premium: t.tiers?.code !== 'basic',
    category: t.category,
    price_amount: t.tiers?.price_amount ?? 0
  }));
}
