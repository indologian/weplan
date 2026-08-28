"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/app/(marketing)/_components/theme-toggle";
import { 
  Home, 
  Plus, 
  Settings, 
  LogOut, 
  Menu, 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  ChevronDown 
} from "lucide-react";

type Invitation = {
  id: string;
  slug: string;
  couple: any;
};

export function DashboardSidebar({ invitations = [] }: { invitations?: Invitation[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Deteksi invitation id dari URL: /dashboard/[id]/...
  const pathParts = pathname.split("/");
  const activeId = pathParts[1] === "dashboard" && pathParts[2] && pathParts[2] !== "settings" ? pathParts[2] : null;

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg border bg-background p-2 shadow-sm lg:hidden"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-[260px] flex-col border-r bg-card transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-2 border-b px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">weplan</Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-8">
          {/* Menu Utama */}
          <div className="space-y-1">
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Utama</p>
            <SidebarLink href="/dashboard" active={pathname === "/dashboard"} icon={<Home className="w-4 h-4" />}>
              Beranda
            </SidebarLink>
            <SidebarLink href="/create" active={pathname === "/create"} icon={<Plus className="w-4 h-4" />}>
              Buat Undangan
            </SidebarLink>
          </div>

          {/* Menu Undangan Aktif */}
          {invitations.length > 0 && (
            <div className="space-y-1">
              <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Undangan Anda</p>
              
              <div className="px-2 mb-4">
                <div className="relative">
                  <select 
                    className="w-full appearance-none rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={activeId || ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        router.push(`/dashboard/${e.target.value}/edit`);
                        setMobileOpen(false);
                      }
                    }}
                  >
                    <option value="" disabled>Pilih undangan...</option>
                    {invitations.map(inv => {
                      const groom = inv.couple?.groom?.name || "";
                      const bride = inv.couple?.bride?.name || "";
                      const name = groom && bride ? `${groom} & ${bride}` : groom || bride || inv.slug;
                      return (
                        <option key={inv.id} value={inv.id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {activeId && (
                <div className="space-y-1 pl-2 border-l-2 border-muted ml-2">
                  <SidebarLink 
                    href={`/dashboard/${activeId}/edit`} 
                    active={pathname.includes(`/${activeId}/edit`)} 
                    icon={<LayoutDashboard className="w-4 h-4" />}
                  >
                    Editor Konten
                  </SidebarLink>
                  <SidebarLink 
                    href={`/dashboard/${activeId}/tamu`} 
                    active={pathname.includes(`/${activeId}/tamu`)} 
                    icon={<Users className="w-4 h-4" />}
                  >
                    Buku Tamu & RSVP
                  </SidebarLink>
                  <SidebarLink 
                    href={`/dashboard/${activeId}/rekening`} 
                    active={pathname.includes(`/${activeId}/rekening`)} 
                    icon={<CreditCard className="w-4 h-4" />}
                  >
                    Rekening (Gift)
                  </SidebarLink>
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="border-t p-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-medium text-muted-foreground">Tema Gelap</span>
            <ThemeToggle />
          </div>
          
          <div className="space-y-1">
            <SidebarLink href="/settings" active={pathname === "/settings"} icon={<Settings className="w-4 h-4" />}>
              Pengaturan
            </SidebarLink>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
