import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/modules/auth/server/require-user";
import { getDashboardInvitations } from "@/modules/invitation/server/dashboard-queries";
import { actionDeleteInvitation } from "@/modules/invitation/server/actions";
import { Button } from "@/shared/components/ui/button";
import { DashboardInvitationCard } from "../_components/dashboard-invitation-card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const invitations = await getDashboardInvitations(user.id);

  return (
    <div className="space-y-7 sm:space-y-8">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Undangan Saya</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Lanjutkan penyusunan, periksa hasil, dan kelola undangan pernikahan Anda.
          </p>
        </div>
        <Button asChild className="h-11 w-fit shrink-0 px-4">
          <Link href="/create">
            <Plus aria-hidden="true" />
            Buat Undangan
          </Link>
        </Button>
      </header>

      {invitations.length === 0 ? (
        <section
          aria-labelledby="empty-invitations-title"
          className="rounded-2xl border bg-card px-5 py-10 text-center text-card-foreground sm:px-8 sm:py-14"
        >
          <div className="mx-auto max-w-md">
            <h2 id="empty-invitations-title" className="text-lg font-semibold">
              Belum ada undangan
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Pilih tema untuk membuat draf pertama. Setelah itu, Anda akan langsung masuk ke editor undangan.
            </p>
            <Button asChild className="mt-5 h-11">
              <Link href="/create">Pilih Tema</Link>
            </Button>
          </div>
        </section>
      ) : (
        <section aria-labelledby="invitation-list-title">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="invitation-list-title" className="text-base font-semibold">Daftar undangan</h2>
            <p className="text-sm text-muted-foreground">{invitations.length} undangan</p>
          </div>
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <DashboardInvitationCard
                key={invitation.id}
                invitation={invitation}
                deleteInvitation={actionDeleteInvitation}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
