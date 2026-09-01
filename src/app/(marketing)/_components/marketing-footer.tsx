import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t py-12">
      <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
        <p className="mb-4">&copy; {new Date().getFullYear()} weplan. Hak cipta dilindungi.</p>
        <div className="flex justify-center gap-6">
          <Link href="/legal/kebijakan-privasi" className="hover:underline p-2 min-h-[44px] flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Privasi</Link>
          <Link href="/legal/syarat-ketentuan" className="hover:underline p-2 min-h-[44px] flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Syarat & Ketentuan</Link>
        </div>
      </div>
    </footer>
  );
}
