import Link from "next/link";

type Invitation = {
  id: string;
  slug: string;
  status: string;
  couple: Record<string, any>;
  theme_id: string;
  published_at: string | null;
  expires_at: string | null;
  entitlement_tier_id: string | null;
  updated_at: string;
};

export function DashboardInvitationCard({ inv }: { inv: Invitation }) {
  const groom = inv.couple?.groom?.name ?? "";
  const bride = inv.couple?.bride?.name ?? "";
  const displayName = groom && bride ? `${groom} & ${bride}` : groom || bride || "Tanpa nama";
  const isPublished = inv.status === "published";
  const isExpired = inv.expires_at && new Date(inv.expires_at) <= new Date();

  let statusLabel = "Draft";
  let statusColor = "bg-[#f3f4f6] text-[#6b7280]";
  if (isExpired) {
    statusLabel = "Expired";
    statusColor = "bg-red-50 text-red-600";
  } else if (isPublished) {
    statusLabel = "Published";
    statusColor = "bg-green-50 text-green-700";
  }

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="font-medium">{displayName}</h3>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <p className="mb-4 text-xs text-[#9ca3af]">/{inv.slug}</p>

      <div className="flex gap-2">
        <a
          href={`/dashboard/${inv.id}/edit`}
          className="inline-flex items-center rounded-lg border border-[#d1d5db] px-3 py-1.5 text-xs font-medium text-[#1a1a1a] hover:bg-[#f9fafb]"
        >
          Lanjut Edit
        </a>
        <a
          href={`/preview/${inv.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg border border-[#d1d5db] px-3 py-1.5 text-xs font-medium text-[#1a1a1a] hover:bg-[#f9fafb]"
        >
          Preview
        </a>
        {isPublished && (
          <a
            href={`/${inv.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-[#6b7280] hover:text-[#1a1a1a]"
          >
            Lihat +-
          </a>
        )}
      </div>
    </div>
  );
}
