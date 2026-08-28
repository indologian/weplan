import { requireUser } from "@/modules/auth/server/require-user";
import { getEditorDTO } from "@/modules/invitation/server/queries";
import { notFound } from "next/navigation";
import { InvitationBankAccountsEditor } from "@/modules/invitation/components/invitation-bank-accounts-editor";
import { actionSaveEditorContent } from "@/modules/invitation/server/actions";

export default async function RekeningPage({
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
        <h2 className="text-xl font-semibold">Manajemen Rekening (Wedding Gift)</h2>
        <p className="text-sm text-muted-foreground">Kelola rekening bank atau dompet digital untuk menerima hadiah.</p>
      </div>

      <InvitationBankAccountsEditor
        invitationId={invitation.invitationId}
        initialVersion={invitation.contentVersion}
        initialBankAccounts={invitation.bankAccounts}
        saveEditorContent={actionSaveEditorContent}
      />
    </div>
  );
}
