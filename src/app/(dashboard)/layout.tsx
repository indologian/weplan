import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { requireUser } from "@/modules/auth/server/require-user";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const supabase = createSupabaseServiceClient();
  
  const { data } = await supabase
    .from("invitations")
    .select("id, slug, couple")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  const invitations = data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar invitations={invitations} />
      <main className="ml-0 lg:ml-[260px] min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
