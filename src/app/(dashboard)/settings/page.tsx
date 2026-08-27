import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { requireUser } from "@/modules/auth/server/require-user";
import { ensureUserProfile } from "@/modules/auth/server/ensure-user-profile";
import { actionLogout } from "@/modules/auth/server/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let profile: { email: string; full_name: string; role: string; created_at: string } | null = null;

  try {
    const user = await requireUser();
    await ensureUserProfile(user);

    const supabase = createSupabaseServiceClient();
    const { data } = await supabase
      .from("user_profiles")
      .select("email, full_name, role, created_at")
      .eq("id", user.id)
      .maybeSingle();

    profile = data;
  } catch {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-[#6b7280]">Silakan masuk terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-[#6b7280]">Kelola profil dan pengaturan akun Anda</p>
      </div>

      <section className="rounded-xl border border-[#e5e7eb] bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">Profil</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-3">
            <dt className="text-[#6b7280]">Email</dt>
            <dd className="font-medium">{profile?.email ?? "-"}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-3">
            <dt className="text-[#6b7280]">Nama</dt>
            <dd className="font-medium">{profile?.full_name || "-"}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-3">
            <dt className="text-[#6b7280]">Role</dt>
            <dd className="font-medium capitalize">{profile?.role ?? "user"}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-[#6b7280]">Terdaftar</dt>
            <dd className="font-medium">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                : "-"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-red-100 bg-white p-6">
        <h2 className="mb-2 text-lg font-medium text-red-600">Danger Zone</h2>
        <p className="mb-4 text-sm text-[#6b7280]">
          Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <form action={actionLogout}>
            <button
              type="submit"
              className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              Keluar
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
