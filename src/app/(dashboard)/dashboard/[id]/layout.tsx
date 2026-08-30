import Link from "next/link";
import { requireUser } from "@/modules/auth/server/require-user";
import { getEditorDTO } from "@/modules/invitation/server/queries";
import { getAllThemes } from "@/modules/theme/server/queries";
import { CheckoutButton } from "./checkout-button";
import { notFound, redirect } from "next/navigation";
import { projectInvitationWorkspaceState } from "@/modules/invitation/workspace-state";
import { actionUpdateEditorTheme } from "@/modules/invitation/server/actions";
import { EditorWorkspaceProvider } from "@/modules/invitation/components/editor/editor-workspace-context";
import { DashboardHeaderActions } from "./dashboard-header-actions";

export default async function InvitationDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const [invitation, themes] = await Promise.all([
    getEditorDTO(user.id, id),
    getAllThemes()
  ]);

  if (!invitation) {
    notFound();
  }

  const workspace = projectInvitationWorkspaceState({
    status: invitation.status,
    entitlementTierId: invitation.entitlementTierId,
    expiresAt: invitation.expiresAt,
    deletedAt: null,
  });

  if (!workspace.editable) redirect("/dashboard");

  return (
    <EditorWorkspaceProvider initialVersion={invitation.contentVersion}>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Manajemen Undangan</h1>
          <DashboardHeaderActions 
            invitation={invitation} 
            themes={themes} 
            updateTheme={actionUpdateEditorTheme} 
          />
        </div>
        
        <div className="flex flex-col gap-6">
          <main className="w-full min-w-0">
            {children}
          </main>
        </div>
      </div>
    </EditorWorkspaceProvider>
  );
}
