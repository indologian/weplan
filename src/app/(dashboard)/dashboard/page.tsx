import Link from "next/link";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { requireUser } from "@/modules/auth/server/require-user";
import { ensureUserProfile } from "@/modules/auth/server/ensure-user-profile";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let invitations: Array<{
    id: string;
    slug: string;
    status: string;
    couple: Record<string, Record<string, string>>;
    theme_id: string;
    published_at: string | null;
    expires_at: string | null;
    entitlement_tier_id: string | null;
    updated_at: string;
  }> = [];

  try {
    const user = await requireUser();
    await ensureUserProfile(user);

    const supabase = createSupabaseServiceClient();
    const { data } = await supabase
      .from("invitations")
      .select("id, slug, status, couple, theme_id, published_at, expires_at, entitlement_tier_id, updated_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    invitations = data ?? [];
  } catch {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-[#6b7280]">Silakan masuk terlebih dahulu.</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-[#1a1a1a] underline">
          Masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Undangan</h1>
          <p className="text-sm text-[#6b7280]">Kelola undangan pernikahan Anda</p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white hover:bg-[#333]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 2v10M2 7h10" />
          </svg>
          Buat Undangan
        </Link>
      </div>

      {invitations.length === 0 ? (
        <div className="rounded-xl border border-[#e5e7eb] bg-white py-16 text-center">
          <p className="text-[#6b7280]">Belum ada undangan — pilih tema untuk membuat draft pertama.</p>
          <Link
            href="/create"
            className="mt-4 inline-flex items-center rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white hover:bg-[#333]"
          >
            Pilih Tema
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {invitations.map((inv) => {
            const groom = inv.couple?.groom?.name ?? "";
            const bride = inv.couple?.bride?.name ?? "";
            const displayName = groom && bride ? `${groom} & ${bride}` : groom || bride || "Tanpa nama";
            const isPublished = inv.status === "published";
            const isExpired = inv.expires_at && new Date(inv.expires_at) <= new Date();

            let statusLabel = "Draft";
            let statusColor = "bg-[#f3f4f6] text-[#6b7280]";
            if (isExpired) {
              statusLabel = "Expired";
              statusColor = "bg-red-50 text-red-600";
            } else if (isPublished) {
              statusLabel = "Published";
              statusColor = "bg-green-50 text-green-700";
            }

            return (
              <div
                key={inv.id}
                className="rounded-xl border border-[#e5e7eb] bg-white p-5 transition-shadow hover:shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-medium">{displayName}</h3>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>

                <p className="mb-4 text-xs text-[#9ca3af]">/{inv.slug}</p>

                <div className="flex gap-2">
                  <a
                    href={`/dashboard/${inv.id}/edit`}
                    className="inline-flex items-center rounded-lg border border-[#d1d5db] px-3 py-1.5 text-xs font-medium text-[#1a1a1a] hover:bg-[#f9fafb]"
                  >
                    Lanjut Edit
                  </a>
                  <a
                    href={`/dashboard/${inv.id}/preview`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg border border-[#d1d5db] px-3 py-1.5 text-xs font-medium text-[#1a1a1a] hover:bg-[#f9fafb]"
                  >
                    Preview
                  </a>
                  {isPublished && (
                    <a
                      href={`/${inv.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-[#6b7280] hover:text-[#1a1a1a]"
                    >
                      Lihat ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
