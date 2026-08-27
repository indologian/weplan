import Link from "next/link";
import { type FeaturedThemeDTO } from "@/modules/theme/server/queries";

export function FeaturedThemes({ themes }: { themes: FeaturedThemeDTO[] }) {
  return (
    <section className="bg-muted/30 py-24 dark:bg-[#1a1a1a]">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight">Pilih Tema Favorit Anda</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Beragam pilihan desain elegan yang disesuaikan dengan konsep pernikahan impian Anda.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {themes?.map((theme) => (
            <div key={theme.id} className="group relative overflow-hidden rounded-xl border bg-background shadow-sm transition-all hover:shadow-md dark:border-[#333]">
              <div className="aspect-[3/4] bg-muted relative">
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
            href="/katalog" 
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-medium hover:underline text-primary dark:text-[#f8f9fa]"
          >
            Lihat semua tema &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
