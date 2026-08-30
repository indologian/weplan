import { createOrSyncInvitation } from "@/modules/invitation/server/actions";
import { CreateInvitationForm } from "../_components/create-invitation-form";

export default function CreatePage() {
  return <CreateInvitationForm createInvitation={createOrSyncInvitation} />;
}
