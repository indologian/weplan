import type { PublicInvitationDTO } from "./types";
import { BaselineRenderer } from "./themes/_baseline/renderer";
import { ModernEditorialRenderer } from "./themes/modern-editorial/renderer";
import { RomanticFloralRenderer } from "./themes/romantic-floral/renderer";
import { JavaneseHeritageRenderer } from "./themes/javanese-heritage/renderer";
import { LuxuryMidnightRenderer } from "./themes/luxury-midnight/renderer";

type Props = {
  invitation: PublicInvitationDTO;
};

function renderByRendererKey(invitation: PublicInvitationDTO) {
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

export function WeddingRenderer({ invitation }: Props) {
  const content = renderByRendererKey(invitation);

  if (!content) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Tema undangan tidak tersedia.</p>
      </div>
    );
  }

  return <>{content}</>;
}
