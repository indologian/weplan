import type { SectionRendererProps } from "@/modules/theme/renderer";
import { GiftCard } from "@/modules/theme/primitives/gift-card";

export function Gift({ invitation }: SectionRendererProps) {
  if (invitation.bankAccounts.length === 0) return null;

  return (
    <section
      className="romantic-floral"
      style={{ background: "var(--rf-bg)", textAlign: "center" }}
    >
      <p className="rf-overline">Amplop Digital</p>
      <div className="rf-floral-divider">
        <span className="rf-floral-dot" />
      </div>
      <p style={{ color: "var(--rf-muted)", marginBottom: "1.5rem" }}>
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
          />
        ))}
      </div>
    </section>
  );
}
