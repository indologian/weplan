import Link from "next/link";

export function FinalCta() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-primary/5 dark:bg-primary/10"></div>
      <div className="mx-auto max-w-4xl px-6 text-center space-y-8">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
          Siap membagikan hari bahagia Anda?
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Pilih tema, lengkapi informasi acara, lalu preview undangan Anda sebelum dipublikasikan.
        </p>
        <div className="pt-4">
          <Link
            href="/create"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-primary px-10 py-4 text-base font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Mulai Buat Undangan
          </Link>
        </div>
      </div>
    </section>
  );
}
