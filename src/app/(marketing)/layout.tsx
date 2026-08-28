import { Button } from "@/shared/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicEnv } from "@/shared/lib/env/public";
import { ThemeProvider } from "./_components/theme-provider";
import { ThemeToggle } from "./_components/theme-toggle";

export const metadata: Metadata = {
  title: "weplan - Undangan Pernikahan Digital",
  description: "Buat undangan pernikahan digital premium dari HP. Pilih tema, isi detail, dan lihat hasilnya langsung.",
  openGraph: {
    title: "weplan - Undangan Pernikahan Digital",
    description: "Platform undangan pernikahan digital elegan yang terasa seperti milik kalian.",
    url: getPublicEnv().NEXT_PUBLIC_APP_URL,
    siteName: "weplan",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "weplan",
    description: "Undangan yang terasa seperti milik kalian.",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen flex flex-col bg-background text-foreground">
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

        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t py-12 mt-16">
          <div className="mx-auto max-w-5xl px-6 text-center text-sm text-muted-foreground">
            <p className="mb-4">Ac {new Date().getFullYear()} weplan. Hak cipta dilindungi.</p>
            <div className="flex justify-center gap-6">
              <Link href="/legal/kebijakan-privasi" className="hover:underline p-2 min-h-[44px] flex items-center">Privasi</Link>
              <Link href="/legal/syarat-ketentuan" className="hover:underline p-2 min-h-[44px] flex items-center">Syarat & Ketentuan</Link>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
