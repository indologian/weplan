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
      <Image unoptimized
        src={media.url}
        alt={`Potret ${name ?? "mempelai"}`}
        width={media.width ?? 600}
        height={media.height ?? 750}
        sizes="(max-width: 480px) 44vw, 210px"
        style={{ objectPosition: `${media.focusX * 100}% ${media.focusY * 100}%` }}
      />
    </div>
  );
}
