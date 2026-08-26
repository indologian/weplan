import type { SectionRendererProps } from "@/modules/theme/renderer";

export function Couple({ invitation }: SectionRendererProps) {
  const groom = invitation.couple.groom;
  const bride = invitation.couple.bride;

  return (
    <section style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Mempelai</h2>
      <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
        <div>
          <p>{groom?.name ?? ""}</p>
          {groom?.parentNames && groom.parentNames.length > 0 && (
            <p style={{ fontSize: "0.875rem", opacity: 0.7 }}>
              {groom.parentNames.join(" & ")}
            </p>
          )}
        </div>
        <div style={{ fontSize: "1.5rem", alignSelf: "center" }}>&</div>
        <div>
          <p>{bride?.name ?? ""}</p>
          {bride?.parentNames && bride.parentNames.length > 0 && (
            <p style={{ fontSize: "0.875rem", opacity: 0.7 }}>
              {bride.parentNames.join(" & ")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
