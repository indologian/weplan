import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/shared/components/ui/sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const weddingDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-wedding-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "weplan",
  description: "Platform undangan pernikahan digital.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${weddingDisplay.variable} font-sans`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
