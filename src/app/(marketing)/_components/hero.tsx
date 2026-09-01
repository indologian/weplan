import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { FeaturedThemeDTO } from "@/modules/theme/server/queries";

export function Hero({ theme }: { theme?: FeaturedThemeDTO }) {
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
            Buat undangan pernikahan digital yang elegan dan personal. Sesuaikan tema, galeri foto, hingga musik pengiring dengan mudah.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <Link
              href="/create"
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Buat Undangan Sekarang
            </Link>
            <Link
              href="/katalog"
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-lg px-6 text-base font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Lihat Katalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        
        <div className="relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-2xl overflow-hidden bg-muted lg:ml-auto max-w-[480px] mx-auto lg:mx-0 border shadow-sm group">
          {theme?.thumbnail_url ? (
            <Image
              src={theme.thumbnail_url}
              alt={`Tema undangan ${theme.name}`}
              fill
              fetchPriority="high"
              sizes="(max-width: 530px) calc(100vw - 48px), 480px"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <span className="text-muted-foreground">Preview Tema</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none"></div>
          {theme && (
            <div className="absolute bottom-6 left-6 right-6 text-white pointer-events-none">
              <p className="text-sm font-medium opacity-90 mb-2">Tema: {theme.name}</p>
              {theme.is_premium && (
                <div className="flex gap-2">
                  <span className="inline-flex rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1 text-xs text-amber-200">
                    Premium
                  </span>
                </div>
              )}
            </div>
          )}
          {theme?.code && (
            <Link href={`/demo/${theme.code}`} prefetch={false} className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl" aria-label={`Lihat demo tema ${theme.name}`}>
              <span className="sr-only">Lihat demo</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
