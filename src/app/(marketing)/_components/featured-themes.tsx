import Link from "next/link";
import Image from "next/image";
import { type FeaturedThemeDTO } from "@/modules/theme/server/queries";
import { Button } from "@/shared/components/ui/button";

export function FeaturedThemes({ 
  themes, 
  hideHeader = false 
}: { 
  themes: FeaturedThemeDTO[],
  hideHeader?: boolean 
}) {
  if (!themes || themes.length === 0) return null;

  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        {!hideHeader && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Pilihan Tema Desain</h2>
              <p className="text-muted-foreground text-lg">
                Setiap tema dirancang secara unik untuk menyesuaikan dengan kepribadian dan gaya pernikahan Anda.
              </p>
            </div>
            <Link 
              href="/katalog" 
              className="inline-flex h-10 items-center justify-center text-sm font-medium hover:text-primary whitespace-nowrap"
            >
              Lihat semua tema &rarr;
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {themes.map((theme) => (
            <div key={theme.id} className="group flex flex-col">
              <Link href={`/demo/${theme.code}`} className="block relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted mb-4">
                {theme.thumbnail_url ? (
                  <Image
                    src={theme.thumbnail_url}
                    alt={theme.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
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
              </Link>
              <div className="flex flex-col flex-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  {theme.category}
                </span>
                <h3 className="font-semibold text-lg leading-tight mb-1">{theme.name}</h3>
                <div className="text-sm text-muted-foreground mb-4">
                  {theme.price_amount > 0 ? (
                    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(theme.price_amount)
                  ) : (
                    "Gratis"
                  )}
                </div>
                <div className="mt-auto pt-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/demo/${theme.code}`}>Lihat Demo</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
