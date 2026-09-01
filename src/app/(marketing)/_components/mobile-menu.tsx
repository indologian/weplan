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
      <SheetContent className="w-[300px] sm:w-[350px]">
        <SheetHeader className="text-left mb-8">
          <SheetTitle className="font-semibold tracking-tight text-xl">weplan</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6">
          <nav className="flex flex-col gap-4 text-sm font-medium">
            <Link 
              href="/katalog" 
              className="hover:text-primary transition-colors py-2"
              onClick={() => setOpen(false)}
            >
              Katalog Tema
            </Link>
            <Link 
              href="/lead-magnet" 
              className="hover:text-primary transition-colors py-2"
              onClick={() => setOpen(false)}
            >
              Checklist Pernikahan
            </Link>
          </nav>
          <div className="h-px w-full bg-border" />
          <div className="flex flex-col gap-3">
            <Button variant="outline" asChild className="w-full justify-center">
              <Link href="/login" onClick={() => setOpen(false)}>Masuk</Link>
            </Button>
            <Button asChild className="w-full justify-center">
              <Link href="/create" onClick={() => setOpen(false)}>Coba Tema Gratis</Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
