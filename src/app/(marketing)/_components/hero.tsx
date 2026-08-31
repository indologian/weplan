import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative px-6 py-20 md:py-32 overflow-hidden">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <div className="flex flex-col items-start max-w-2xl">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium mb-6 bg-background/50 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Platform Undangan Digital Weplan
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-[1.1] mb-6">
            Undangan yang terasa seperti milik kalian.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
            Buat undangan pernikahan digital yang elegan dan personal. Sesuaikan tema, galeri foto, hingga musik pengiring hanya dalam beberapa menit.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <Link
              href="/create"
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Buat Undangan Sekarang
            </Link>
            <Link
              href="/katalog"
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-lg px-6 text-base font-medium transition-colors hover:bg-muted"
            >
              Lihat Katalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        
        <div className="relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-2xl overflow-hidden bg-muted lg:ml-auto max-w-[480px] mx-auto lg:mx-0 border shadow-sm">
          {/* Real product visual slot - using an aesthetic placeholder for now */}
          <img 
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200" 
            alt="Contoh desain undangan Weplan" 
            className="object-cover w-full h-full"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <p className="text-sm font-medium opacity-90 mb-1">Tema: Classic Botanical</p>
            <div className="flex gap-2">
              <span className="inline-flex rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1 text-xs">Galeri</span>
              <span className="inline-flex rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1 text-xs">RSVP</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
