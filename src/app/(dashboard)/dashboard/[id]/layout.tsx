import Link from "next/link";
import { requireUser } from "@/modules/auth/server/require-user";
import { getEditorDTO } from "@/modules/invitation/server/queries";
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

  const invitation = await getEditorDTO(user.id, id);

  if (!invitation) {
    notFound();
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Manajemen Undangan</h1>
        <div className="flex items-center space-x-2">
          <Link
            href={`/dashboard/${id}/preview`}
            className="text-sm font-medium border rounded-md px-4 py-2 hover:bg-muted"
          >
            Preview
          </Link>
          <a
            href={`/${invitation.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium bg-primary text-primary-foreground rounded-md px-4 py-2 hover:opacity-90"
          >
            Buka Halaman Publik
          </a>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2">
            <Link 
              href={`/dashboard/${id}/edit`} 
              className="text-sm font-medium px-4 py-2 rounded-md hover:bg-muted flex-shrink-0"
            >
              Editor Tema
            </Link>
            <Link 
              href={`/dashboard/${id}/tamu`} 
              className="text-sm font-medium px-4 py-2 rounded-md hover:bg-muted flex-shrink-0"
            >
              Buku Tamu & RSVP
            </Link>
            <Link 
              href={`/dashboard/${id}/rekening`} 
              className="text-sm font-medium px-4 py-2 rounded-md hover:bg-muted flex-shrink-0"
            >
              Manajemen Rekening (Gift)
            </Link>
          </nav>
        </aside>
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
