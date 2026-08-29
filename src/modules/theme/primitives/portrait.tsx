import Image from "next/image";
import type { PublicInvitationDTO } from "@/modules/invitation/types";

type Props = {
  invitation: PublicInvitationDTO;
  mediaId?: string;
  name?: string;
  variant: "circle" | "arch" | "heritage" | "oval";
};

export function Portrait({ invitation, mediaId, name, variant }: Props) {
  const media = invitation.media.find((item) => item.mediaId === mediaId);
  if (!media) return null;
  return (
    <div className={`theme-portrait theme-portrait-${variant}`}>
      <img
        src={media.url}
        alt={`Potret ${name ?? "mempelai"}`}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${media.focusX * 100}% ${media.focusY * 100}%` }}
      />
    </div>
  );
}
