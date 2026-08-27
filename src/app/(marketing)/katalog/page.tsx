import { getFeaturedThemes } from "@/modules/theme/server/queries";
import { FeaturedThemes } from "../_components/featured-themes";

export const metadata = {
  title: "Katalog Tema | Weplan",
  description: "Eksplorasi seluruh koleksi tema undangan pernikahan digital di Weplan.",
};

export default async function KatalogPage() {
  const themes = await getFeaturedThemes(20);

  return (
    <div className="flex flex-col pt-24 min-h-screen">
      <div className="mx-auto max-w-5xl px-6 w-full text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Katalog Tema</h1>
        <p className="text-muted-foreground mt-4">Temukan tema yang paling sesuai dengan kisah Anda.</p>
      </div>
      <FeaturedThemes themes={themes} />
    </div>
  );
}
