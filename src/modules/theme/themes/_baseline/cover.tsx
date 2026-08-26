import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Cover({ invitation }: SectionRendererProps) {
  const groomName = invitation.couple.groom?.name ?? "";
  const brideName = invitation.couple.bride?.name ?? "";

  return (
    <section
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <p>Undangan Pernikahan</p>
      <h1 style={{ fontSize: "2.5rem", margin: "1rem 0" }}>
        {groomName}
        <span style={{ display: "block", fontSize: "1.5rem", margin: "0.5rem 0" }}>&</span>
        {brideName}
      </h1>
    </section>
  );
}
