import type { SectionRendererProps } from "@/modules/theme/renderer";
import { GiftCard } from "@/modules/theme/primitives/gift-card";

export function Gift({ invitation }: SectionRendererProps) {
  if (invitation.bankAccounts.length === 0) return null;

  return (
    <section
      className="modern-editorial"
      style={{ background: "var(--me-bg)", textAlign: "center" }}
    >
      <p className="me-overline me-animate">Amplop Digital</p>
      <hr className="me-rule me-animate me-delay-1" style={{ marginBottom: "1rem" }} />
      <p className="me-animate me-delay-2" style={{ color: "var(--me-muted)", marginBottom: "3rem" }}>
        Terima kasih atas doa restu dan hadiah yang diberikan kepada mempelai.
      </p>
      <div
        className="me-animate me-delay-3"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          maxWidth: "400px",
          margin: "0 auto",
        }}
      >
        {invitation.bankAccounts.map((account) => (
          <GiftCard
            key={account.id}
            bankName={account.bankName}
            accountNumber={account.accountNumber}
            accountHolder={account.accountHolder}
            qris={invitation.media.find((media) => media.mediaId === account.qrisMediaId)}
          />
        ))}
      </div>
    </section>
  );
}
