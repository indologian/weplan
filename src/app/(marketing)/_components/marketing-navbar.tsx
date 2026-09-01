import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { MobileMenu } from "./mobile-menu";

export function MarketingNavbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4" aria-label="Global">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-semibold tracking-tight text-xl rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-1 -ml-1">weplan</Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/katalog" className="hover:text-foreground transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Katalog Tema</Link>
            <Link href="/lead-magnet" className="hover:text-foreground transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Checklist Pernikahan</Link>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Button variant="ghost" asChild className="hidden md:inline-flex min-h-[44px]">
            <Link href={isAuthenticated ? "/dashboard" : "/login"}>
              {isAuthenticated ? "Dashboard" : "Masuk"}
            </Link>
          </Button>
          <Button asChild className="hidden md:inline-flex min-h-[44px]">
            <Link href="/create">Coba Tema Gratis</Link>
          </Button>
          <MobileMenu isAuthenticated={isAuthenticated} />
        </div>
      </nav>
    </header>
  );
}
