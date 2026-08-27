import { requireUser } from "@/modules/auth/server/require-user";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { notFound } from "next/navigation";

export default async function RekeningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const supabase = createSupabaseServiceClient();
  const { data: invitation } = await supabase
    .from("invitations")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!invitation) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Manajemen Rekening (Wedding Gift)</h2>
        <p className="text-sm text-muted-foreground">Kelola rekening bank atau dompet digital untuk menerima hadiah.</p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground text-center py-12">
          Halaman ini digunakan untuk menambah atau menghapus daftar rekening dan QRIS yang akan ditampilkan pada undangan Anda.
          (Data aktual diatur dari dalam form Editor Tema).
        </p>
      </div>
    </div>
  );
}
