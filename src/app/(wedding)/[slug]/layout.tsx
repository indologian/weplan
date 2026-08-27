import type { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  let title = "Undangan Pernikahan";
  let description = "Undangan pernikahan digital";

  try {
    const { createSupabaseServiceClient } = await import("@/shared/lib/supabase/service-client");
    const supabase = createSupabaseServiceClient();

    const { data: invitation } = await supabase
      .from("invitations")
      .select("couple, is_private")
      .eq("slug", slug)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();

    if (invitation && !invitation.is_private) {
      const couple = invitation.couple as Record<string, Record<string, string>>;
      const groom = couple?.groom?.name ?? "";
      const bride = couple?.bride?.name ?? "";
      if (groom && bride) {
        title = `${groom} & ${bride} - Undangan Pernikahan`;
        description = `Undangan pernikahan ${groom} & ${bride}`;
      }
    }
  } catch {
    // Use defaults
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default function WeddingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
