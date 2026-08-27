import Link from "next/link";
import { getFeaturedThemes } from "@/modules/theme/server/queries";

export default async function HomePage() {
  const featuredThemes = await getFeaturedThemes(4);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <main className="mx-auto flex min-h-[80svh] max-w-5xl items-center px-6 py-16">
        <section className="max-w-2xl space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">weplan</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Undangan yang terasa seperti milik kalian.</h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            Buat undangan pernikahan digital premium dari HP. Pilih tema, isi detail, dan lihat hasilnya langsung.
          </p>
          <div className="flex gap-3">
            <Link
              href="/create"
              className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 dark:bg-[#f8f9fa] dark:text-[#121212]"
            >
              Coba Tema Gratis
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Masuk
            </Link>
          </div>
        </section>
      </main>

      {/* Featured Themes Section */}
      <section className="bg-muted/30 py-24 dark:bg-[#1a1a1a]">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight">Pilih Tema Favorit Anda</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Beragam pilihan desain elegan yang disesuaikan dengan konsep pernikahan impian Anda.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredThemes?.map((theme) => (
              <div key={theme.id} className="group relative overflow-hidden rounded-xl border bg-background shadow-sm transition-all hover:shadow-md dark:border-[#333]">
                <div className="aspect-[3/4] bg-muted relative">
                  {/* We use a standard div for the image to support any URL, as requested by audit avoiding next/image for external/unconfigured domains without setup, though next/image is preferred. But weplan uses it via next.config */}
                  {theme.thumbnail_url ? (
                    <img 
                      src={theme.thumbnail_url} 
                      alt={theme.name}
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      No Preview
                    </div>
                  )}
                  {theme.is_premium && (
                    <span className="absolute top-3 right-3 rounded-full bg-[#c4a87c] px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                      Premium
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-lg leading-none mb-2">{theme.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{theme.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link 
              href="/themes" 
              className="inline-flex min-h-[44px] items-center text-sm font-medium hover:underline text-primary dark:text-[#f8f9fa]"
            >
              Lihat semua tema &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Cara Kerja Section */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight">Cara Kerja</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tiga langkah mudah menuju undangan pernikahan digital impian Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl dark:bg-[#f8f9fa]/10 dark:text-[#f8f9fa]">1</div>
              <h3 className="font-semibold text-lg">Pilih Tema</h3>
              <p className="text-muted-foreground text-sm">Eksplorasi koleksi tema kami dan temukan yang paling cocok dengan konsep acara Anda.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl dark:bg-[#f8f9fa]/10 dark:text-[#f8f9fa]">2</div>
              <h3 className="font-semibold text-lg">Isi Detail Acara</h3>
              <p className="text-muted-foreground text-sm">Masukkan informasi mempelai, jadwal acara, lokasi, hingga cerita cinta Anda melalui form yang mudah digunakan.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl dark:bg-[#f8f9fa]/10 dark:text-[#f8f9fa]">3</div>
              <h3 className="font-semibold text-lg">Sebarkan Undangan</h3>
              <p className="text-muted-foreground text-sm">Setelah selesai, undangan digital siap disebarkan ke keluarga dan kerabat Anda.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-muted/30 py-24 dark:bg-[#1a1a1a]">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight">Harga Transparan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tidak ada biaya tersembunyi.
            </p>
          </div>

          <div className="mx-auto grid max-w-3xl grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl border bg-background p-8 shadow-sm dark:border-[#333]">
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

            <div className="rounded-2xl border border-primary bg-primary/5 p-8 shadow-sm dark:bg-[#333]/20 dark:border-[#555]">
              <h3 className="text-xl font-semibold text-primary dark:text-[#f8f9fa]">Premium</h3>
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
              <Link href="/create" className="mt-8 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-medium transition-colors dark:bg-[#f8f9fa] dark:text-[#121212]">
                Daftar Premium
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
