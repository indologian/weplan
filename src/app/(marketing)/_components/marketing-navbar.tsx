import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function MarketingNavbar() {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-5xl items-center justify-between p-4 sm:px-6" aria-label="Global">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-semibold tracking-tight text-xl">weplan</Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/katalog" className="hover:text-foreground transition-colors">Katalog Tema</Link>
            <Link href="/lead-magnet" className="hover:text-foreground transition-colors">Checklist Pernikahan</Link>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Button variant="ghost" asChild className="hidden sm:inline-flex min-h-[44px]">
            <Link href="/login">Masuk</Link>
          </Button>
          <Button asChild className="min-h-[44px]">
            <Link href="/create">Coba Tema Gratis</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
