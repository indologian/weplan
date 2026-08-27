import type { PublicInvitationDTO } from "@/modules/invitation/types";
import { getRendererLoader } from "./registry";

type Props = {
  invitation: PublicInvitationDTO;
  guestName?: string;
};

export async function WeddingRenderer({ invitation, guestName }: Props) {
  const loadRenderer = getRendererLoader(invitation.theme.rendererKey);
  if (!loadRenderer) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Tema undangan tidak tersedia.</p>
      </div>
    );
  }

  const Renderer = await loadRenderer();
  return <Renderer invitation={invitation} guestName={guestName} />;
}
