import type { Metadata } from "next";
import { getPublicEnv } from "@/shared/lib/env/public";
import { ThemeProvider } from "./_components/theme-provider";
import { MarketingNavbar } from "./_components/marketing-navbar";
import { MarketingFooter } from "./_components/marketing-footer";
import { getOptionalUser } from "@/modules/auth/server/get-optional-user";

export const metadata: Metadata = {
  title: "weplan - Undangan Pernikahan Digital",
  description: "Buat undangan pernikahan digital premium dari HP. Pilih tema, isi detail, dan lihat hasilnya langsung.",
  openGraph: {
    title: "weplan - Undangan Pernikahan Digital",
    description: "Platform undangan pernikahan digital elegan yang terasa seperti milik kalian.",
    url: getPublicEnv().NEXT_PUBLIC_APP_URL,
    siteName: "weplan",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "weplan",
    description: "Undangan yang terasa seperti milik kalian.",
  },
};

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getOptionalUser();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <MarketingNavbar isAuthenticated={Boolean(user)} />
        <main className="flex-1">
          {children}
        </main>
        <MarketingFooter />
      </div>
    </ThemeProvider>
  );
}
