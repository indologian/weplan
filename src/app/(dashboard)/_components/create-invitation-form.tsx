"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/browser-client";
import type { CreatedInvitation } from "@/modules/invitation/types";
import type { ActionResult } from "@/shared/types/action-result";

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
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

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

  async function handleCreate() {
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
        clientRef: crypto.randomUUID(),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Buat Undangan</h1>
        <p className="text-sm text-[#6b7280]">Pilih tema dan isi nama mempelai</p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-[#374151]">Pilih Tema</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedThemeId(theme.id)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                selectedThemeId === theme.id
                  ? "border-[#1a1a1a] bg-[#f9fafb]"
                  : "border-[#e5e7eb] bg-white hover:border-[#d1d5db]"
              }`}
            >
              <h3 className="font-medium">{theme.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-[#6b7280]">{theme.description}</p>
              <span className="mt-2 inline-block rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-medium uppercase text-[#6b7280]">
                {theme.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-[#374151]">Nama Mempelai</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="groomName" className="mb-1 block text-xs text-[#6b7280]">Mempelai Pria</label>
            <input
              id="groomName"
              type="text"
              value={groomName}
              onChange={(event) => setGroomName(event.target.value)}
              placeholder="Nama pria"
              className="w-full rounded-lg border border-[#d1d5db] px-3 py-2 text-sm focus:border-[#1a1a1a] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="brideName" className="mb-1 block text-xs text-[#6b7280]">Mempelai Wanita</label>
            <input
              id="brideName"
              type="text"
              value={brideName}
              onChange={(event) => setBrideName(event.target.value)}
              placeholder="Nama wanita"
              className="w-full rounded-lg border border-[#d1d5db] px-3 py-2 text-sm focus:border-[#1a1a1a] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={pending || !selectedThemeId}
        className="inline-flex items-center rounded-lg bg-[#1a1a1a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Membuat..." : "Buat Undangan"}
      </button>
    </div>
  );
}
