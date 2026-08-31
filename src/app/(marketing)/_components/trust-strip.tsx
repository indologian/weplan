export function TrustStrip() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-6 lg:sticky lg:top-32">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Cara Kerja</h2>
            <p className="text-muted-foreground text-lg max-w-md">
              Hanya butuh tiga langkah mudah untuk mewujudkan undangan pernikahan digital impian Anda. Tidak perlu keahlian desain.
            </p>
          </div>

          <div className="space-y-12">
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">1</div>
                <div className="w-px h-full bg-border mt-4"></div>
              </div>
              <div className="pb-8">
                <h3 className="font-semibold text-xl mb-2">Pilih Tema</h3>
                <p className="text-muted-foreground">Eksplorasi koleksi tema kami dan temukan yang paling cocok dengan konsep acara Anda. Semua tema dapat disesuaikan.</p>
              </div>
            </div>
            
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">2</div>
                <div className="w-px h-full bg-border mt-4"></div>
              </div>
              <div className="pb-8">
                <h3 className="font-semibold text-xl mb-2">Isi Detail Acara</h3>
                <p className="text-muted-foreground">Masukkan informasi mempelai, jadwal acara, lokasi, hingga cerita cinta Anda melalui editor form yang mudah digunakan.</p>
              </div>
            </div>
            
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-lg">3</div>
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Sebarkan Undangan</h3>
                <p className="text-muted-foreground">Setelah selesai, undangan digital langsung online dan siap dibagikan ke keluarga serta kerabat Anda melalui WhatsApp atau media sosial.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
