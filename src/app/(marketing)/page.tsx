import { getFeaturedThemes } from "@/modules/theme/server/queries";
import { Hero } from "./_components/hero";
import { FeaturedThemes } from "./_components/featured-themes";
import { TrustStrip } from "./_components/trust-strip";
import { Pricing } from "./_components/pricing";
import { FAQ } from "./_components/faq";

export default async function HomePage() {
  const featuredThemes = await getFeaturedThemes(4);

  return (
    <div className="flex flex-col">
      <Hero />
      <FeaturedThemes themes={featuredThemes} />
      <TrustStrip />
      <Pricing />
      <FAQ />
    </div>
  );
}
