import type { PublicInvitationDTO } from "@/modules/invitation/types";

export type RendererProps = {
  invitation: PublicInvitationDTO;
  guestName?: string;
  guestToken?: string;
};

export type RendererComponent = React.ComponentType<RendererProps>;
export type RendererLoader = () => Promise<RendererComponent>;
