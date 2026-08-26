import type { SectionRendererProps } from "@/modules/theme/renderer";
import { GiftCard } from "@/modules/theme/primitives/gift-card";

export function Gift({ invitation }: SectionRendererProps) {
  if (invitation.bankAccounts.length === 0) return null;

  return (
    <section style={{ padding: "2rem" }}>
      <h2>Amplop Digital</h2>
      <p style={{ marginBottom: "1rem", opacity: 0.7 }}>
        Kirim hadiah kepada mempelai melalui rekening berikut.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
