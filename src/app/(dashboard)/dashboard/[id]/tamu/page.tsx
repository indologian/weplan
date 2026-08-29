import { requireUser } from "@/modules/auth/server/require-user";
import { getEditorDTO } from "@/modules/invitation/server/queries";
import { notFound } from "next/navigation";
import { getManagedGuests } from "@/modules/guest/server/management";
import { GuestManager } from "@/modules/guest/components/guest-manager";
import { RsvpSettings } from "@/modules/guest/components/rsvp-settings";

export default async function TamuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const [invitation, guests] = await Promise.all([getEditorDTO(user.id, id), getManagedGuests(user.id, id)]);

  if (!invitation) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Buku Tamu & RSVP</h2>
        <p className="text-sm text-muted-foreground">Kelola daftar tamu dan ucapan dari pengunjung.</p>
      </div>

      <RsvpSettings invitationId={invitation.invitationId} initialVersion={invitation.contentVersion} initialMode={invitation.rsvpMode} initialModeration={invitation.guestbookModeration}/>
      <GuestManager invitationId={invitation.invitationId} guests={guests}/>
    </div>
  );
}
