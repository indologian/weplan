import { Bodoni_Moda, Montserrat } from "next/font/google";

export const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-lm-display",
});

export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font-lm-body",
});

