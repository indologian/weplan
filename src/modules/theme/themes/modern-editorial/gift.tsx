import type { SectionRendererProps } from "@/modules/theme/renderer";
import { GiftCard } from "@/modules/theme/primitives/gift-card";

export function Gift({ invitation }: SectionRendererProps) {
  if (invitation.bankAccounts.length === 0) return null;

  return (
    <section
      className="me-section me-gift"
      aria-labelledby="gift-title"
    >
      <h2 id="gift-title" className="me-reveal">Hadiah pernikahan</h2>
      <p className="me-gift-intro me-reveal">
        Terima kasih atas doa restu dan hadiah yang diberikan kepada mempelai.
      </p>
      <div
        className="me-gift-list me-reveal"
      >
        {invitation.bankAccounts.map((account) => (
          <GiftCard
            key={account.id}
            bankName={account.bankName}
            accountNumber={account.accountNumber}
            accountHolder={account.accountHolder}
            qris={invitation.media.find((media) => media.mediaId === account.qrisMediaId)}
            className="me-gift-card"
          />
        ))}
      </div>
    </section>
  );
}
