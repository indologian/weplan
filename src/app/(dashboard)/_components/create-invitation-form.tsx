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
};

export function CreateInvitationForm({
  createInvitation,
}: {
  createInvitation: (input: unknown) => Promise<ActionResult<CreatedInvitation>>;
}) {
  const router = useRouter();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const clientRef = useRef<string>("");

  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = crypto.randomUUID();
    }
  }, []);

  useEffect(() => {
    async function loadThemes() {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("themes")
        .select("id, name, slug, tier_id, category, description")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (data) setThemes(data);
    }
    void loadThemes();
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

      if (response.data) router.push(`/dashboard/${response.data.invitationId}/edit`);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pilih Tema</h1>
          <p className="text-muted-foreground">Pilih desain dasar undangan Anda. Tema masih bisa diganti nanti.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedThemeId(theme.id)}
              className={`group relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                selectedThemeId === theme.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-muted bg-background hover:border-primary/50"
              }`}
            >
              <div className="w-full aspect-[3/4] rounded-md bg-muted flex items-center justify-center overflow-hidden mb-2">
                <span className="text-muted-foreground text-sm font-medium">Thumbnail Tema</span>
              </div>
              <h3 className="font-semibold">{theme.name}</h3>
              <p className="line-clamp-2 text-xs text-muted-foreground">{theme.description}</p>
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground mt-auto">
                {theme.category}
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => setStep(2)}
            disabled={!selectedThemeId}
            className="w-full sm:w-auto"
          >
            Lanjut <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button variant="ghost" onClick={() => setStep(1)} className="mb-4 -ml-4 text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali pilih tema
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Detail Awal</h1>
        <p className="text-muted-foreground">Isi nama panggilan kedua mempelai. Anda bisa melengkapinya nanti.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groomName">Mempelai Pria</Label>
                <Input
                  id="groomName"
                  type="text"
                  value={groomName}
                  onChange={(event) => setGroomName(event.target.value)}
                  placeholder="Nama panggilan pria"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brideName">Mempelai Wanita</Label>
                <Input
                  id="brideName"
                  type="text"
                  value={brideName}
                  onChange={(event) => setBrideName(event.target.value)}
                  placeholder="Nama panggilan wanita"
                />
              </div>
            </div>

            {error && <p className="text-sm font-medium text-destructive" aria-live="polite">{error}</p>}

            <Button
              type="submit"
              disabled={pending || !groomName.trim() || !brideName.trim()}
              className="w-full"
            >
              {pending ? "Membuat Undangan..." : "Buat Undangan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
