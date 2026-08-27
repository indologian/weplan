import Link from "next/link";

export function Pricing() {
  return (
    <section className="bg-muted/30 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-16 text-center space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight">Harga Transparan</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tidak ada biaya tersembunyi.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-2xl border bg-background p-8 shadow-sm">
            <h3 className="text-xl font-semibold">Basic</h3>
            <div className="my-4 flex items-baseline text-4xl font-extrabold">
              Gratis
            </div>
            <p className="text-muted-foreground text-sm mb-6">Cocok untuk mencoba fitur dasar Weplan.</p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">✓ Tema standar</li>
              <li className="flex items-center gap-2">✓ Galeri max 10 foto</li>
              <li className="flex items-center gap-2">✓ RSVP & Buku Tamu</li>
              <li className="flex items-center gap-2 text-muted-foreground">✗ Tanpa Watermark</li>
            </ul>
            <Link href="/create" className="mt-8 flex min-h-[44px] w-full items-center justify-center rounded-lg border border-border bg-background hover:bg-muted font-medium transition-colors">
              Mulai Gratis
            </Link>
          </div>

          <div className="rounded-2xl border border-primary bg-primary/5 p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-primary">Premium</h3>
            <div className="my-4 flex items-baseline text-4xl font-extrabold">
              Rp 149.000
            </div>
            <p className="text-muted-foreground text-sm mb-6">Fitur lengkap untuk momen tak terlupakan.</p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">✓ Akses semua tema premium</li>
              <li className="flex items-center gap-2">✓ Galeri foto tanpa batas</li>
              <li className="flex items-center gap-2">✓ Audio & Background Music</li>
              <li className="flex items-center gap-2">✓ Tanpa Watermark Weplan</li>
            </ul>
            <Link href="/create" className="mt-8 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-medium transition-colors">
              Daftar Premium
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
