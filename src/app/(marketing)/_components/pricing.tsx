import Link from "next/link";
import { Check, X } from "lucide-react";

export function Pricing() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Harga Transparan</h2>
            <p className="text-muted-foreground text-lg">
              Satu harga untuk semua fitur premium. Tidak ada biaya langganan bulanan atau biaya tersembunyi lainnya.
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border bg-background p-8 flex flex-col">
              <h3 className="text-xl font-semibold">Basic</h3>
              <div className="my-4 flex items-baseline text-4xl font-semibold tracking-tight">
                Gratis
              </div>
              <p className="text-muted-foreground text-sm mb-6">Cocok untuk mencoba fitur dasar Weplan.</p>
              <ul className="space-y-4 text-sm mb-8 flex-1">
                <li className="flex items-start gap-3"><Check className="h-5 w-5 text-green-500 shrink-0" /> <span>Tema standar</span></li>
                <li className="flex items-start gap-3"><Check className="h-5 w-5 text-green-500 shrink-0" /> <span>Galeri max 10 foto</span></li>
                <li className="flex items-start gap-3"><Check className="h-5 w-5 text-green-500 shrink-0" /> <span>RSVP & Buku Tamu</span></li>
                <li className="flex items-start gap-3 text-muted-foreground"><X className="h-5 w-5 shrink-0 opacity-50" /> <span>Tanpa watermark Weplan</span></li>
                <li className="flex items-start gap-3 text-muted-foreground"><X className="h-5 w-5 shrink-0 opacity-50" /> <span>Audio & Background Music</span></li>
              </ul>
              <Link href="/create" className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-border bg-background hover:bg-muted font-medium transition-colors">
                Mulai Gratis
              </Link>
            </div>

            <div className="rounded-2xl border-2 border-primary bg-primary/5 p-8 relative flex flex-col shadow-sm">
              <div className="absolute top-0 right-8 -translate-y-1/2">
                <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Paling Populer
                </span>
              </div>
              <h3 className="text-xl font-semibold text-primary">Premium</h3>
              <div className="my-4 flex items-baseline text-4xl font-semibold tracking-tight">
                Rp 149.000
              </div>
              <p className="text-muted-foreground text-sm mb-6">Fitur lengkap untuk momen tak terlupakan.</p>
              <ul className="space-y-4 text-sm mb-8 flex-1">
                <li className="flex items-start gap-3"><Check className="h-5 w-5 text-primary shrink-0" /> <span>Akses semua tema premium</span></li>
                <li className="flex items-start gap-3"><Check className="h-5 w-5 text-primary shrink-0" /> <span>Galeri foto tanpa batas</span></li>
                <li className="flex items-start gap-3"><Check className="h-5 w-5 text-primary shrink-0" /> <span>RSVP & Buku Tamu</span></li>
                <li className="flex items-start gap-3"><Check className="h-5 w-5 text-primary shrink-0" /> <span>Tanpa watermark Weplan</span></li>
                <li className="flex items-start gap-3"><Check className="h-5 w-5 text-primary shrink-0" /> <span>Audio & Background Music</span></li>
              </ul>
              <Link href="/create" className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-medium transition-colors">
                Daftar Premium
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
