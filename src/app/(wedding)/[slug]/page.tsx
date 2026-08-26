import { notFound } from "next/navigation";
import "@/modules/theme/init";
import { getPublicInvitation, PublicInvitationError } from "@/modules/invitation/server/public-queries";
import type { PublicInvitationDTO } from "@/modules/theme/types";
import { BaselineRenderer } from "@/modules/theme/themes/_baseline/renderer";
import { ModernEditorialRenderer } from "@/modules/theme/themes/modern-editorial/renderer";
import { RomanticFloralRenderer } from "@/modules/theme/themes/romantic-floral/renderer";
import { JavaneseHeritageRenderer } from "@/modules/theme/themes/javanese-heritage/renderer";
import { LuxuryMidnightRenderer } from "@/modules/theme/themes/luxury-midnight/renderer";

type Props = {
  params: Promise<{ slug: string }>;
};

function renderInvitation(invitation: PublicInvitationDTO) {
  switch (invitation.theme.rendererKey) {
    case "_baseline":
      return <BaselineRenderer invitation={invitation} />;
    case "modern-editorial-ivory":
      return <ModernEditorialRenderer invitation={invitation} />;
    case "romantic-floral-watercolor":
      return <RomanticFloralRenderer invitation={invitation} />;
    case "javanese-heritage":
      return <JavaneseHeritageRenderer invitation={invitation} />;
    case "luxury-midnight":
      return <LuxuryMidnightRenderer invitation={invitation} />;
    default:
      return null;
  }
}

export default async function WeddingPage({ params }: Props) {
  const { slug } = await params;

  const invitation = await getPublicInvitation(slug).catch((error) => {
    if (error instanceof PublicInvitationError) {
      if (error.code === "PRIVATE") {
        return null;
      }
      notFound();
    }
    throw error;
  });

  if (!invitation) {
    return <PrivateGate />;
  }

  const content = renderInvitation(invitation);
  if (!content) {
    notFound();
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      {content}
    </div>
  );
}

function PrivateGate() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Undangan Privat</h1>
      <p>Undangan ini memerlukan PIN untuk dibuka.</p>
    </div>
  );
}
