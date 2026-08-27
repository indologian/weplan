import Link from "next/link";

export function Hero() {
  return (
    <section className="relative px-6 py-24 md:py-32 flex flex-col items-center text-center">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="max-w-3xl space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
          Undangan yang terasa <br className="hidden md:inline" />
          <span className="text-primary">seperti milik kalian.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Platform pembuat undangan digital premium dengan ratusan tema elegan. Sesuaikan warna, musik, hingga galeri dalam beberapa menit.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/create"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 w-full sm:w-auto"
          >
            Coba Tema Gratis
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border px-8 py-3 text-sm font-medium hover:bg-muted w-full sm:w-auto"
          >
            Masuk
          </Link>
        </div>
      </div>
    </section>
  );
}
