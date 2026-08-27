import { requireUser } from "@/modules/auth/server/require-user";
import { getEditorDTO } from "@/modules/invitation/server/queries";
import { notFound } from "next/navigation";

export default async function TamuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const invitation = await getEditorDTO(user.id, id);

  if (!invitation) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Buku Tamu & RSVP</h2>
        <p className="text-sm text-muted-foreground">Kelola daftar tamu dan ucapan dari pengunjung.</p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground text-center py-12">
          Fitur manajemen tamu akan segera hadir. Anda dapat mengelola mode RSVP (Public/Private) melalui menu pengaturan utama.
        </p>
      </div>
    </div>
  );
}
