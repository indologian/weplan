import type { PublicInvitationDTO } from "@/modules/invitation/types";

export function PhysicalGift({ invitation }: { invitation: PublicInvitationDTO }) {
  const gift = invitation.settings.physicalGift;
  if (!gift?.enabled || (!gift.recipient && !gift.address)) return null;
  return (
    <section className="theme-generic-section" aria-labelledby="physical-gift-title">
      <p className="theme-overline">Kirim Hadiah</p>
      <h2 id="physical-gift-title">Alamat Penerima</h2>
      {gift.recipient && <p>{gift.recipient}</p>}
      {gift.address && <address>{gift.address}</address>}
    </section>
  );
}
