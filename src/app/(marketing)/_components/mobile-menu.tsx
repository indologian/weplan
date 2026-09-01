"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden min-h-[44px] min-w-[44px] shrink-0" aria-label="Buka menu navigasi">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="flex h-full flex-col px-6 py-8">
          <SheetHeader className="text-left mb-8">
            <SheetTitle className="font-semibold tracking-tight text-xl">weplan</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-6">
            <nav className="flex flex-col text-sm font-medium">
              <Link 
                href="/katalog" 
                className="hover:text-primary transition-colors py-3 flex items-center min-h-[44px] rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setOpen(false)}
              >
                Katalog Tema
              </Link>
              <Link 
                href="/lead-magnet" 
                className="hover:text-primary transition-colors py-3 flex items-center min-h-[44px] rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setOpen(false)}
              >
                Checklist Pernikahan
              </Link>
            </nav>
            <div className="h-px w-full bg-border" />
            <div className="flex flex-col gap-4">
              <Button variant="outline" asChild className="w-full justify-center min-h-[44px]">
                <Link href="/login" onClick={() => setOpen(false)}>Masuk</Link>
              </Button>
              <Button asChild className="w-full justify-center min-h-[44px]">
                <Link href="/create" onClick={() => setOpen(false)}>Coba Tema Gratis</Link>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
