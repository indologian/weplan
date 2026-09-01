import { Inter, Playfair_Display } from "next/font/google";

export const modernEditorialDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-modern-editorial-display",
  display: "swap",
});

export const modernEditorialBody = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-modern-editorial-body",
  display: "swap",
});
