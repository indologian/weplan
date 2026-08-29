import Link from "next/link";
import { requireUser } from "@/modules/auth/server/require-user";
import { getEditorDTO } from "@/modules/invitation/server/queries";
import { getAllThemes } from "@/modules/theme/server/queries";
import { CheckoutButton } from "./checkout-button";
import { ThemeChangerModal } from "../../_components/theme-changer-modal";
import { notFound } from "next/navigation";

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

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Manajemen Undangan</h1>
        <div className="flex items-center space-x-2">
          <ThemeChangerModal 
            invitationId={invitation.invitationId} 
            currentThemeId={invitation.themeId}
            expectedVersion={invitation.contentVersion}
            themes={themes}
          />
          <Link
            href={`/preview/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium border rounded-md px-4 py-2 hover:bg-muted"
          >
            Preview
          </Link>
          {invitation.status === "published" ? (
            <a
              href={`/${invitation.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium bg-primary text-primary-foreground rounded-md px-4 py-2 hover:opacity-90"
            >
              Buka Halaman Publik
            </a>
          ) : (
            <CheckoutButton invitationId={invitation.invitationId} />
          )}
        </div>
      </div>
      
      <div className="flex flex-col gap-6">
        <main className="w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
