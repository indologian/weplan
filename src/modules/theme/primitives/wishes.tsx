import type { PublicInvitationDTO } from "@/modules/invitation/types";

export function Wishes({ invitation }: { invitation: PublicInvitationDTO }) {
  if (invitation.wishes.length === 0) return null;
  return (
    <section className="theme-generic-section" aria-labelledby="wishes-title">
      <p className="theme-overline">Ucapan & Doa</p>
      <h2 id="wishes-title">Dari Tamu</h2>
      <div className="theme-wishes">
        {invitation.wishes.map((wish) => (
          <blockquote key={`${wish.name}-${wish.createdAt}`}>
            <p>{wish.wishMessage}</p><footer>— {wish.name}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
