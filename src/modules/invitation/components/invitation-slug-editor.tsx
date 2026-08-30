"use client";

import { useState, useEffect } from "react";
import type { ActionResult } from "@/shared/types/action-result";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

type Props = {
  invitationId: string;
  initialSlug: string;
  checkSlugAvailability: (slug: string, invitationId: string) => Promise<boolean>;
  updateSlug: (input: unknown) => Promise<ActionResult<{ slug: string }>>;
};

export function InvitationSlugEditor({ invitationId, initialSlug, checkSlugAvailability, updateSlug }: Props) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialSlug);
  const debouncedSlug = useDebounce(slug, 500);
  
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isValidFormat = /^[a-z0-9-]+$/.test(debouncedSlug) && debouncedSlug.length >= 3 && debouncedSlug.length <= 50;
  const isInitialSlug = debouncedSlug === initialSlug;
  const formatError = "Format tidak valid. Gunakan huruf kecil, angka, dan strip (3-50 karakter).";
  const displayedAvailability = isInitialSlug ? null : isValidFormat ? isAvailable : false;
  const displayedError = isValidFormat ? errorMsg : formatError;

  useEffect(() => {
    if (debouncedSlug === initialSlug || !isValidFormat) return;

    let isMounted = true;
    const check = async () => {
      setIsChecking(true);
      setErrorMsg("");
      try {
        const available = await checkSlugAvailability(debouncedSlug, invitationId);
        if (isMounted) {
          setIsAvailable(available);
          if (!available) setErrorMsg("Tautan ini sudah digunakan. Pilih nama lain.");
        }
      } catch {
        if (isMounted) setErrorMsg("Gagal mengecek ketersediaan tautan.");
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };
    void check();
    
    return () => { isMounted = false; };
  }, [checkSlugAvailability, debouncedSlug, invitationId, initialSlug, isValidFormat]);

  const handleSave = async () => {
    if (slug === initialSlug || isAvailable === false || !isValidFormat) return;
    
    setIsSaving(true);
    try {
      const result = await updateSlug({ invitationId, slug });
      if (result.success) {
        toast.success("Tautan undangan berhasil diperbarui!");
        setIsAvailable(null);
        router.refresh();
      } else {
        toast.error(result.error || "Gagal menyimpan tautan.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Tautan (Slug)</CardTitle>
        <CardDescription>
          Sesuaikan tautan unik untuk undangan Anda (misal: weplan.web.id/romeo-juliet).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Tautan Publik</Label>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground text-sm bg-muted px-3 py-2 rounded-md border border-r-0 rounded-r-none">
                weplan.web.id/
              </span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  setIsAvailable(null);
                  setErrorMsg("");
                }}
                className={`rounded-l-none flex-1 ${
                  displayedAvailability === false ? "border-destructive focus-visible:ring-destructive" : ""
                } ${displayedAvailability === true ? "border-green-500 focus-visible:ring-green-500" : ""}`}
                placeholder="nama-kamu"
              />
            </div>
            
            <div className="h-5 flex items-center text-sm">
              {isChecking && (
                <span className="flex items-center text-muted-foreground">
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Mengecek ketersediaan...
                </span>
              )}
              {!isChecking && displayedAvailability === true && (
                <span className="flex items-center text-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Tautan tersedia!
                </span>
              )}
              {!isChecking && displayedAvailability === false && (
                <span className="flex items-center text-destructive">
                  <XCircle className="w-3 h-3 mr-1" /> {displayedError}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isSaving || isChecking || displayedAvailability !== true || isInitialSlug || !isValidFormat}
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Simpan Tautan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
