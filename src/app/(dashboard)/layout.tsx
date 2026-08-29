import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { requireUser } from "@/modules/auth/server/require-user";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { ThemeProvider } from "@/app/(marketing)/_components/theme-provider";

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
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <DashboardSidebar invitations={invitations} />
        <main className="ml-0 lg:ml-[260px] min-h-screen pt-14 lg:pt-0">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
