export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
      <section className="max-w-2xl space-y-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">weplan</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Undangan yang terasa seperti milik kalian.</h1>
        <p className="max-w-xl text-lg leading-8 text-muted-foreground">
          Buat undangan pernikahan digital premium dari HP. Pilih tema, isi detail, dan lihat hasilnya langsung.
        </p>
        <div className="flex gap-3">
          <a
            href="/login"
            className="inline-flex items-center rounded-lg bg-[#1a1a1a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#333]"
          >
            Masuk
          </a>
          <a
            href="/register"
            className="inline-flex items-center rounded-lg border border-[#d1d5db] px-5 py-2.5 text-sm font-medium text-[#1a1a1a] hover:bg-[#f9fafb]"
          >
            Daftar
          </a>
        </div>
      </section>
    </main>
  );
}
