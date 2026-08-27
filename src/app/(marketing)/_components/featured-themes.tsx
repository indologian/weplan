import Link from "next/link";
import { type FeaturedThemeDTO } from "@/modules/theme/server/queries";
import { Button } from "@/shared/components/ui/button";

export function FeaturedThemes({ themes }: { themes: FeaturedThemeDTO[] }) {
  return (
    <section className="bg-muted/30 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight">Pilih Tema Favorit Anda</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Beragam pilihan desain elegan yang disesuaikan dengan konsep pernikahan impian Anda.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {themes?.map((theme) => (
            <div key={theme.id} className="group flex flex-col relative overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="aspect-[3/4] bg-muted relative overflow-hidden">
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
              <div className="p-5 flex flex-col flex-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {theme.category}
                </span>
                <h3 className="font-semibold text-lg leading-none mb-2">{theme.name}</h3>
                <div className="text-sm font-medium mt-1">
                  {theme.price_amount > 0 ? (
                    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(theme.price_amount)
                  ) : (
                    "Gratis"
                  )}
                </div>
                <div className="mt-auto pt-5">
                  <Button asChild className="w-full">
                    <Link href={`/demo/${theme.code}`}>Coba Tema Ini</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link 
            href="/katalog" 
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-medium hover:underline text-primary"
          >
            Lihat semua tema &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
