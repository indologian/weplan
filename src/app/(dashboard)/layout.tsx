import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { AuthenticationError, requireUser } from "@/modules/auth/server/require-user";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { ThemeProvider } from "@/app/(marketing)/_components/theme-provider";
import { ensureUserProfile } from "@/modules/auth/server/ensure-user-profile";
import { redirect } from "next/navigation";
import { projectInvitationWorkspaceState } from "@/modules/invitation/workspace-state";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser().catch((error: unknown) => {
    if (error instanceof AuthenticationError) redirect("/login?redirect=/dashboard");
    throw error;
  });
  await ensureUserProfile(user);
  const supabase = createSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("invitations")
    .select("id, slug, couple, status, entitlement_tier_id, expires_at, deleted_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  const invitations = error
    ? []
    : (data ?? []).filter((invitation) => projectInvitationWorkspaceState({
        status: invitation.status,
        entitlementTierId: invitation.entitlement_tier_id,
        expiresAt: invitation.expires_at,
        deletedAt: invitation.deleted_at,
      }).editable);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-dvh antialiased selection:bg-primary/10 selection:text-primary bg-muted/30 dark:bg-background text-foreground">
        <a
          href="#dashboard-main"
          className="fixed left-3 top-3 z-70 -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:translate-y-0"
        >
          Lewati ke konten utama
        </a>
        <DashboardSidebar invitations={invitations} />
        <main id="dashboard-main" className="min-h-[calc(100dvh-3.5rem)] lg:min-h-dvh lg:pl-60">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
