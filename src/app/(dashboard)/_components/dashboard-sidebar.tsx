"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

export function DashboardSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-[#d1d5db] bg-white p-2 shadow-sm lg:hidden"
        aria-label="Menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-[240px] flex-col border-r border-[#e5e7eb] bg-white transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-2 border-b border-[#e5e7eb] px-4 py-3">
          <span className="text-lg font-semibold tracking-tight">weplan</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            <SidebarLink href="/dashboard" active={pathname === "/dashboard"} icon="home">
              Beranda
            </SidebarLink>
            <SidebarLink href="/create" active={pathname === "/create"} icon="plus">
              Buat Undangan
            </SidebarLink>
            <SidebarLink href="/settings" active={pathname === "/settings"} icon="settings">
              Pengaturan
            </SidebarLink>
          </div>
        </nav>

        <div className="border-t border-[#e5e7eb] px-3 py-3">
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1a1a1a]"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" />
              </svg>
              Keluar
            </button>
          </form>
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
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-[#1a1a1a] text-white"
          : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1a1a1a]"
      }`}
    >
      <SidebarIcon name={icon} />
      {children}
    </a>
  );
}

function SidebarIcon({ name }: { name: string }) {
  switch (name) {
    case "home":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 6l6-4 6 4v7a1 1 0 01-1 1H3a1 1 0 01-1-1V6z" />
          <path d="M6 14V9h4v5" />
        </svg>
      );
    case "plus":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 3v10M3 8h10" />
        </svg>
      );
    case "settings":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="2" />
          <path d="M13.5 8a5.5 5.5 0 01-.3 1.7l1.1.9-1.4 1.4-.9-1.1a5.5 5.5 0 01-1.7.3V12h-2v-.8a5.5 5.5 0 01-1.7-.3l-.9 1.1L4.5 10.6l1.1-.9A5.5 5.5 0 015.3 8H4.5v-2h.8a5.5 5.5 0 01.3-1.7L4.5 3.4 5.9 2l.9 1.1a5.5 5.5 0 011.7-.3V2h2v.8a5.5 5.5 0 011.7.3L12.2 2l1.4 1.4-1.1.9a5.5 5.5 0 01-.3 1.7H13.5v2z" />
        </svg>
      );
    default:
      return null;
  }
}
