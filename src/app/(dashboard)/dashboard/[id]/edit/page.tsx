import { notFound } from "next/navigation";
import { requireUser } from "@/modules/auth/server/require-user";
import { actionIssueSensitiveAuth } from "@/modules/auth/server/sensitive-auth-actions";
import {
  actionDeleteEditorEvent,
  actionReplaceEditorGallery,
  actionReorderEditorEvents,
  actionSaveEditorContent,
  actionSaveEditorEvent,
  actionUpdateEditorPrivacy,
  actionCheckSlugAvailability,
  actionUpdateEditorSlug,
} from "@/modules/invitation/server/actions";
import { getEditorDTO } from "@/modules/invitation/server/queries";
import { InvitationEditor } from "@/modules/invitation/components/invitation-editor";
import { InvitationSlugEditor } from "@/modules/invitation/components/invitation-slug-editor";

export default async function EditInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const editor = await getEditorDTO(user.id, id);
  if (!editor) notFound();
  return (
    <div className="space-y-6">
      <InvitationSlugEditor
        invitationId={editor.invitationId}
        initialSlug={editor.slug}
        checkSlugAvailability={actionCheckSlugAvailability}
        updateSlug={actionUpdateEditorSlug}
      />
      <InvitationEditor
        initialData={editor}
        saveEditorContent={actionSaveEditorContent}
        saveEditorEvent={actionSaveEditorEvent}
        deleteEditorEvent={actionDeleteEditorEvent}
        reorderEditorEvents={actionReorderEditorEvents}
        replaceEditorGallery={actionReplaceEditorGallery}
        issueSensitiveAuth={actionIssueSensitiveAuth}
        updateEditorPrivacy={actionUpdateEditorPrivacy}
      />
    </div>
  );
}
