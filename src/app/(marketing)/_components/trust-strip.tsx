export function TrustStrip() {
  return (
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
  );
}
