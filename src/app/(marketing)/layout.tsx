import type { Metadata } from "next";
import Link from "next/link";
import { getPublicEnv } from "@/shared/lib/env/public";

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
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex max-w-5xl items-center justify-between p-4 sm:px-6" aria-label="Global">
          <Link href="/" className="font-semibold tracking-tight text-xl">weplan</Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium hover:underline p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              Masuk
            </Link>
            <Link 
              href="/create" 
              className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 min-h-[44px] flex items-center justify-center"
            >
              Coba Tema Gratis
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t py-12 mt-16">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-muted-foreground">
          <p className="mb-4">© {new Date().getFullYear()} weplan. Hak cipta dilindungi.</p>
          <div className="flex justify-center gap-6">
            <Link href="/legal/kebijakan-privasi" className="hover:underline p-2 min-h-[44px] flex items-center">Privasi</Link>
            <Link href="/legal/syarat-ketentuan" className="hover:underline p-2 min-h-[44px] flex items-center">Syarat & Ketentuan</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
