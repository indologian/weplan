import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/modules/auth/server/require-user";
import { actionIssueSensitiveAuth } from "@/modules/auth/server/sensitive-auth-actions";
import {
  actionDeleteEditorEvent,
  actionReorderEditorEvents,
  actionSaveEditorContent,
  actionSaveEditorEvent,
  actionUpdateEditorPrivacy,
} from "@/modules/invitation/server/actions";
import { getEditorDTO } from "@/modules/invitation/server/queries";
import { InvitationEditor } from "@/modules/invitation/components/invitation-editor";

export default async function EditInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const editor = await getEditorDTO(user.id, id);
  if (!editor) notFound();
  if (editor.status === "expired" || editor.status === "trashed")
    redirect(`/dashboard/${id}`);
  return (
    <InvitationEditor
      initialData={editor}
      saveEditorContent={actionSaveEditorContent}
      saveEditorEvent={actionSaveEditorEvent}
      deleteEditorEvent={actionDeleteEditorEvent}
      reorderEditorEvents={actionReorderEditorEvents}
      issueSensitiveAuth={actionIssueSensitiveAuth}
      updateEditorPrivacy={actionUpdateEditorPrivacy}
    />
  );
}
