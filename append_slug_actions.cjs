const fs = require('fs');
let c = fs.readFileSync('src/modules/invitation/server/actions.ts', 'utf8');

c += `
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
`;

fs.writeFileSync('src/modules/invitation/server/actions.ts', c);
console.log('Added slug actions!');
