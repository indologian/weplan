import { ImageResponse } from "next/og";

type Props = {
  params: Promise<{ slug: string }>;
};

export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Undangan Pernikahan";

export default async function OpengraphImage({ params }: Props) {
  const { slug } = await params;

  let coupleNames = "Undangan Pernikahan";
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

    if (invitation) {
      if (invitation.is_private) {
        coupleNames = "Undangan Pernikahan";
      } else {
        const couple = invitation.couple as Record<string, Record<string, string>>;
        const groom = couple?.groom?.name ?? "";
        const bride = couple?.bride?.name ?? "";
        if (groom && bride) {
          coupleNames = `${groom} & ${bride}`;
        } else if (groom || bride) {
          coupleNames = `${groom || bride}`;
        }
      }
    }
  } catch {
    coupleNames = "Undangan Pernikahan";
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #fefce8, #fef9c3)",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              color: "#92400e",
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            Wedding Invitation
          </div>
          <div
            style={{
              fontSize: "48px",
              color: "#1c1917",
              fontWeight: "bold",
              textAlign: "center",
              lineHeight: 1.2,
              maxWidth: "800px",
            }}
          >
            {coupleNames}
          </div>
          <div
            style={{
              fontSize: "20px",
              color: "#78716c",
              marginTop: "8px",
            }}
          >
            weplan
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
