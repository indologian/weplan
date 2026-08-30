"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Gift, Home, LogOut, Menu, PencilLine, Plus, Settings, Users } from "lucide-react";
import { DashboardThemeSelector } from "./dashboard-theme-selector";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/lib/utils";

type Invitation = { id: string; slug: string; couple: unknown };

function getInvitationName(invitation: Invitation): string {
  if (!invitation.couple || typeof invitation.couple !== "object") return invitation.slug;
  const couple = invitation.couple as { groom?: { name?: unknown }; bride?: { name?: unknown } };
  const groom = typeof couple.groom?.name === "string" ? couple.groom.name.trim() : "";
  const bride = typeof couple.bride?.name === "string" ? couple.bride.name.trim() : "";
  return groom && bride ? `${groom} & ${bride}` : groom || bride || invitation.slug;
}

export function DashboardSidebar({ invitations = [] }: { invitations?: Invitation[] }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathParts = pathname.split("/");
  const activeId = pathParts[1] === "dashboard" && pathParts[2] ? pathParts[2] : null;

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Buka navigasi dashboard"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </SheetTrigger>
          <SheetContent className="pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
            <SheetHeader className="border-b px-5 pb-4 pr-14">
              <SheetTitle>weplan</SheetTitle>
              <SheetDescription>Area pengelolaan undangan</SheetDescription>
            </SheetHeader>
            <NavigationContent
              pathname={pathname}
              activeId={activeId}
              invitations={invitations}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="text-base font-semibold tracking-tight">weplan</Link>
        <span className="min-w-0 truncate text-sm text-muted-foreground">Undangan Saya</span>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-card text-card-foreground lg:flex">
        <div className="border-b px-5 py-5">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">weplan</Link>
          <p className="mt-1 text-xs text-muted-foreground">Area pengelolaan undangan</p>
        </div>
        <NavigationContent pathname={pathname} activeId={activeId} invitations={invitations} />
      </aside>
    </>
  );
}

function NavigationContent({
  pathname,
  activeId,
  invitations,
  onNavigate,
}: {
  pathname: string;
  activeId: string | null;
  invitations: Invitation[];
  onNavigate?: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav aria-label="Navigasi dashboard" className="flex-1 space-y-7 overflow-y-auto px-4 py-5">
        <div className="space-y-1">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Utama</p>
          <SidebarLink href="/dashboard" active={pathname === "/dashboard"} icon={<Home />} onNavigate={onNavigate}>
            Undangan Saya
          </SidebarLink>
          <SidebarLink href="/create" active={pathname === "/create"} icon={<Plus />} onNavigate={onNavigate}>
            Buat Undangan
          </SidebarLink>
        </div>

        {invitations.length > 0 && (
          <div className="space-y-3">
            <div className="space-y-2 px-2">
              <label htmlFor="invitation-switcher" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Undangan aktif
              </label>
              <select
                id="invitation-switcher"
                className="min-h-11 w-full min-w-0 rounded-md border bg-background px-3 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={activeId ?? ""}
                onChange={(event) => {
                  if (!event.target.value) return;
                  router.push(`/dashboard/${event.target.value}/edit`);
                  onNavigate?.();
                }}
              >
                <option value="">Pilih undangan</option>
                {invitations.map((invitation) => (
                  <option key={invitation.id} value={invitation.id}>{getInvitationName(invitation)}</option>
                ))}
              </select>
              {!activeId && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Pilih undangan untuk membuka menu pengelolaannya.
                </p>
              )}
            </div>

            {activeId && (
              <div className="space-y-1 border-l pl-2">
                <SidebarLink href={`/dashboard/${activeId}/edit`} active={pathname === `/dashboard/${activeId}/edit`} icon={<PencilLine />} onNavigate={onNavigate}>
                  Edit Undangan
                </SidebarLink>
                <SidebarLink href={`/dashboard/${activeId}/tamu`} active={pathname === `/dashboard/${activeId}/tamu`} icon={<Users />} onNavigate={onNavigate}>
                  Tamu & RSVP
                </SidebarLink>
                <SidebarLink href={`/dashboard/${activeId}/rekening`} active={pathname === `/dashboard/${activeId}/rekening`} icon={<Gift />} onNavigate={onNavigate}>
                  Rekening Hadiah
                </SidebarLink>
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="space-y-4 border-t p-4">
        <DashboardThemeSelector />
        <div className="space-y-1">
          <SidebarLink href="/settings" active={pathname === "/settings"} icon={<Settings />} onNavigate={onNavigate}>
            Pengaturan
          </SidebarLink>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Keluar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  active,
  icon,
  children,
  onNavigate,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span className="[&_svg]:size-4" aria-hidden="true">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </Link>
  );
}
