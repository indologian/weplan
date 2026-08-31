"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Gift, Globe, Home, LogOut, Menu, PencilLine, Plus, Settings, Users } from "lucide-react";
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
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:hidden">
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
            <SheetHeader className="border-b border-border/40 px-5 pb-4 pr-14 text-left">
              <SheetTitle className="text-xl">weplan</SheetTitle>
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
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border/40 bg-card lg:flex">
        <div className="border-b border-border/40 px-5 flex h-14 items-center">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">weplan</Link>
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
              <div className="relative">
                <select
                  id="invitation-switcher"
                  className="appearance-none min-h-11 w-full min-w-0 rounded-md border border-border/50 bg-background pl-3 pr-10 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              </div>
              {!activeId && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Pilih undangan untuk membuka menu pengelolaannya.
                </p>
              )}
            </div>

            {activeId && (
              <div className="space-y-1 border-l border-border/40 ml-3 pl-4">
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

      <div className="space-y-4 border-t border-border/40 p-4">
        <DashboardThemeSelector />
        <div className="space-y-1">
          <SidebarLink href="/" active={pathname === "/"} icon={<Globe />} onNavigate={onNavigate}>
            Halaman Utama
          </SidebarLink>
          <SidebarLink href="/settings" active={pathname === "/settings"} icon={<Settings />} onNavigate={onNavigate}>
            Pengaturan
          </SidebarLink>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-out hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span className="[&_svg]:size-4" aria-hidden="true">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </Link>
  );
}
