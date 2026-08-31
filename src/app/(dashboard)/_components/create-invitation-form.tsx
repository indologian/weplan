"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/browser-client";
import type { CreatedInvitation } from "@/modules/invitation/types";
import type { ActionResult } from "@/shared/types/action-result";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { ChevronRight, ArrowLeft } from "lucide-react";
import Image from "next/image";

type Theme = {
  id: string;
  name: string;
  slug: string;
  tier_id: string;
  category: string;
  description: string;
  preview_image: string | null;
};

export function CreateInvitationForm({
  createInvitation,
}: {
  createInvitation: (input: unknown) => Promise<ActionResult<CreatedInvitation>>;
}) {
  const router = useRouter();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoadingThemes, setIsLoadingThemes] = useState(true);
  const [themesError, setThemesError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const clientRef = useRef<string>("");

  useEffect(() => {
    const stored = sessionStorage.getItem("create_invitation_ref");
    if (stored) {
      clientRef.current = stored;
    } else {
      const newRef = crypto.randomUUID();
      sessionStorage.setItem("create_invitation_ref", newRef);
      clientRef.current = newRef;
    }
  }, []);

  useEffect(() => {
    async function loadThemes() {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("themes")
        .select("id, name, slug, tier_id, category, description, preview_image")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (data) setThemes(data);
      else setThemesError("Gagal memuat tema.");
      setIsLoadingThemes(false);
    }
    loadThemes().catch(() => {
      setThemesError("Terjadi kesalahan.");
      setIsLoadingThemes(false);
    });
    
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedThemeId) {
      setError("Pilih tema terlebih dahulu.");
      return;
    }
    if (!groomName.trim() || !brideName.trim()) {
      setError("Isi nama kedua mempelai.");
      return;
    }

    setPending(true);
    setError("");

    try {
      const response = await createInvitation({
        clientRef: clientRef.current,
        themeId: selectedThemeId,
        couple: {
          groom: { name: groomName.trim() },
          bride: { name: brideName.trim() },
        },
      });

      if (!response.success) {
        setError(response.error || "Gagal membuat undangan.");
        return;
      }

      if (response.data) {
        sessionStorage.removeItem("create_invitation_ref");
        router.push(`/dashboard/${response.data.invitationId}/edit`);
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Langkah {step} dari 2</p>
        {step === 1 ? (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">Pilih Tema Desain</h1>
            <p className="text-muted-foreground text-lg">Tentukan tata letak dan nuansa undangan Anda. Tema dapat diubah kapan saja.</p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">Detail Mempelai</h1>
            <p className="text-muted-foreground text-lg">Masukkan nama panggilan untuk melengkapi pembuatan awal undangan.</p>
          </>
        )}
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {isLoadingThemes && <p className="text-muted-foreground col-span-full">Memuat pilihan tema...</p>}
            {themesError && <p className="text-destructive col-span-full">{themesError}</p>}
            {!isLoadingThemes && !themesError && themes.length === 0 && <p className="text-muted-foreground col-span-full">Tidak ada tema yang tersedia saat ini.</p>}
            {themes.map((theme) => {
              const isSelected = selectedThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`group relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-foreground/30 hover:bg-muted/30"
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="w-full aspect-[3/4] rounded-lg bg-muted flex items-center justify-center overflow-hidden relative">
                    {theme.preview_image ? (
                      <Image src={theme.preview_image} alt={theme.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                    ) : (
                      <span className="text-muted-foreground text-xs font-medium">No preview</span>
                    )}
                  </div>
                  <div className="w-full space-y-1">
                    <div className="flex items-center justify-between w-full">
                      <h3 className="font-medium leading-none">{theme.name}</h3>
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {theme.category}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">{theme.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end pt-4 border-t">
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedThemeId}
              size="lg"
              className="w-full sm:w-auto"
            >
              Lanjut ke Detail <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
          <form onSubmit={handleCreate} className="space-y-8 max-w-xl">
            <div className="space-y-6">
              <div className="space-y-2.5">
                <Label htmlFor="groomName" className="text-base font-medium">Mempelai Pria</Label>
                <Input
                  id="groomName"
                  type="text"
                  value={groomName}
                  onChange={(event) => {
                    setGroomName(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Contoh: Romeo"
                  className="h-12 text-lg px-4"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="brideName" className="text-base font-medium">Mempelai Wanita</Label>
                <Input
                  id="brideName"
                  type="text"
                  value={brideName}
                  onChange={(event) => {
                    setBrideName(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Contoh: Juliet"
                  className="h-12 text-lg px-4"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm font-medium text-destructive" aria-live="polite">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => setStep(1)} className="w-full sm:w-auto text-muted-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={pending || !groomName.trim() || !brideName.trim()}
                className="w-full sm:w-auto min-w-[140px]"
              >
                {pending ? "Menyiapkan Draft..." : "Buat Undangan"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
