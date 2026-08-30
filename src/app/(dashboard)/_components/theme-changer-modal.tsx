"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/shared/types/action-result";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Palette } from "lucide-react";

type ThemeOption = {
  id: string;
  name: string;
  thumbnail_url: string | null;
  category: string;
};

export function ThemeChangerModal({
  invitationId,
  currentThemeId,
  expectedVersion,
  themes,
  updateTheme,
}: {
  invitationId: string;
  currentThemeId: string;
  expectedVersion: number;
  themes: ThemeOption[];
  updateTheme: (input: unknown) => Promise<ActionResult<{ contentVersion: number }>>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelectTheme = async (themeId: string) => {
    if (themeId === currentThemeId) {
      setOpen(false);
      return;
    }
    
    setIsUpdating(true);
    const result = await updateTheme({
      invitationId,
      expectedVersion,
      themeId,
    });
    
    if (result.success) {
      toast.success("Tema berhasil diganti!");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error ?? "Gagal mengganti tema. Pastikan pekerjaan Anda tersimpan.");
    }
    setIsUpdating(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Palette className="h-4 w-4" />
          Ganti Tema
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pilih Tema Baru</DialogTitle>
          <DialogDescription>
            Tampilan undangan Anda akan langsung berubah setelah memilih tema baru. Data (mempelai, acara, foto) tetap aman.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`relative flex flex-col gap-2 rounded-xl border p-3 cursor-pointer transition-all hover:border-[#1a1a1a] ${
                theme.id === currentThemeId ? "border-[#1a1a1a] ring-1 ring-[#1a1a1a]" : "border-[#e5e7eb]"
              }`}
              onClick={() => !isUpdating && handleSelectTheme(theme.id)}
            >
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted relative">
                {theme.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={theme.thumbnail_url}
                    alt={theme.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-xs text-muted-foreground">
                    No Preview
                  </div>
                )}
                {theme.id === currentThemeId && (
                  <div className="absolute top-2 right-2 bg-[#1a1a1a] text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    AKTIF
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm text-[#1a1a1a]">{theme.name}</span>
                <span className="text-xs text-[#6b7280] capitalize">{theme.category}</span>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
