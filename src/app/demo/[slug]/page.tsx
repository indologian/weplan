import { notFound } from "next/navigation";
import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import { WeddingRenderer } from "@/modules/theme/wedding-renderer";
import type { PublicInvitationDTO } from "@/modules/invitation/types";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function DemoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  const supabase = createSupabaseServiceClient();
  const { data: theme } = await supabase
    .from("themes")
    .select("renderer_key, name")
    .eq("slug", slug)
    .single();

  if (!theme) notFound();

  // Data Dummy untuk presentasi Demo
  const dummyInvitation: PublicInvitationDTO = {
    invitationId: "demo-id",
    slug: slug,
    isPrivate: false,
    couple: {
      groom: { name: "Romeo Montague", nickname: "Romeo", parentNames: ["Bpk. Montague", "Ibu Montague"], photoMediaId: "groom-photo" },
      bride: { name: "Juliet Capulet", nickname: "Juliet", parentNames: ["Bpk. Capulet", "Ibu Capulet"], photoMediaId: "bride-photo" },
    },
    loveStory: [],
    bankAccounts: [],
    settings: {
      backgroundAudioMediaId: "bg-music",
      sectionVisibility: {
        guestbook: true,
        gallery: true,
        loveStory: true,
      }
    },
    events: [
      {
        eventId: "akad",
        position: 1,
        eventType: "akad",
        title: "Akad Nikah",
        startsAt: "2026-12-25T08:00:00Z",
        endsAt: "2026-12-25T10:00:00Z",
        timezone: "Asia/Jakarta",
        venueName: "Gedung Pernikahan Impian",
        address: "Jl. Cinta Abadi No. 1, Jakarta Selatan",
        latitude: null,
        longitude: null,
      },
      {
        eventId: "resepsi",
        position: 2,
        eventType: "resepsi",
        title: "Resepsi Pernikahan",
        startsAt: "2026-12-25T11:00:00Z",
        endsAt: "2026-12-25T14:00:00Z",
        timezone: "Asia/Jakarta",
        venueName: "Grand Ballroom Hotel",
        address: "Jl. Cinta Abadi No. 2, Jakarta Selatan",
        latitude: null,
        longitude: null,
      }
    ],
    theme: {
      rendererKey: theme.renderer_key,
      designTokens: {},
      layoutConfig: {},
    },
    media: [
      { mediaId: "1", purpose: "cover", variant: "main", url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1080&q=80" },
      { mediaId: "2", purpose: "gallery", variant: "main", url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1080&q=80" },
      { mediaId: "3", purpose: "gallery", variant: "main", url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1080&q=80" },
      { mediaId: "groom-photo", purpose: "profile", variant: "main", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80" },
      { mediaId: "bride-photo", purpose: "profile", variant: "main", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80" },
      { mediaId: "bg-music", purpose: "audio", variant: "main", url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_d16790a6ea.mp3" }
    ],
    guestName: "Tamu Kehormatan",
  };

  return (
    <div className="relative w-full bg-zinc-950 min-h-screen">
      {/* Demo Floating Toolbar */}
      <div className="fixed top-0 left-0 w-full z-50 p-4 flex justify-center pointer-events-none">
        <div className="bg-background/95 backdrop-blur shadow-lg border rounded-full px-4 py-2 flex items-center gap-4 pointer-events-auto">
          <Button variant="ghost" size="sm" asChild className="rounded-full">
            <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Kembali</Link>
          </Button>
          <div className="h-4 w-px bg-border"></div>
          <span className="text-sm font-medium">Demo: {theme.name}</span>
          <div className="h-4 w-px bg-border"></div>
          <Button size="sm" asChild className="rounded-full">
            <Link href="/create">Gunakan Tema Ini</Link>
          </Button>
        </div>
      </div>

      {/* Frame Mobile Render */}
      <div className="mx-auto max-w-[480px] bg-white min-h-screen shadow-2xl relative overflow-x-hidden pt-[72px]">
        <WeddingRenderer invitation={dummyInvitation} />
      </div>
    </div>
  );
}
