import type { SectionRendererProps } from "@/modules/theme/renderer";
import { GiftCard } from "@/modules/theme/primitives/gift-card";
import { FineLineFrame } from "./ornaments";

export function Gift({ invitation }: SectionRendererProps) {
  if (invitation.bankAccounts.length === 0) return null;

  return (
    <section className="luxury-midnight lm-gift" style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
      <p className="lm-overline">Wedding Gift</p>
      <div className="lm-gold-rule" aria-hidden="true" style={{ marginBottom: "2rem" }} />
      <p style={{ color: "var(--lm-muted)", marginBottom: "3rem", fontSize: "0.9375rem" }}>
        Your blessing is the greatest gift of all.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "400px", margin: "0 auto" }}>
        {invitation.bankAccounts.map((account) => (
          <FineLineFrame key={account.id} className="lm-gift-card">
            <GiftCard
              bankName={account.bankName}
              accountNumber={account.accountNumber}
              accountHolder={account.accountHolder}
              qris={invitation.media.find((media) => media.mediaId === account.qrisMediaId)}
            />
          </FineLineFrame>
        ))}
      </div>
    </section>
  );
}

