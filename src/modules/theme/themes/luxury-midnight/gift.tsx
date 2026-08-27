import type { SectionRendererProps } from "@/modules/theme/renderer";
import { GiftCard } from "@/modules/theme/primitives/gift-card";

export function Gift({ invitation }: SectionRendererProps) {
  if (invitation.bankAccounts.length === 0) return null;

  return (
    <section
      className="luxury-midnight"
      style={{ background: "var(--lm-bg)", textAlign: "center" }}
    >
      <p className="lm-overline">Amplop Digital</p>
      <hr className="lm-gold-rule" style={{ marginBottom: "1rem" }} />
      <p style={{ color: "var(--lm-muted)", marginBottom: "1.5rem" }}>
        Kirim hadiah kepada mempelai melalui rekening berikut.
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxWidth: "320px",
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
