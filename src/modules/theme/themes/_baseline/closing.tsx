import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Closing({ invitation }: SectionRendererProps) {
  const groomName = invitation.couple.groom?.name ?? "";
  const brideName = invitation.couple.bride?.name ?? "";

  return (
    <section
      style={{
        padding: "4rem 2rem",
        textAlign: "center",
      }}
    >
      <p>Terima kasih telah menjadi bagian dari hari bahagia kami.</p>
      <p style={{ marginTop: "1rem", fontSize: "1.25rem" }}>
        {groomName} & {brideName}
      </p>
    </section>
  );
}
