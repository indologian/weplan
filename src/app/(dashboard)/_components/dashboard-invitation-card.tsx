import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Eye, ImageIcon, PencilLine } from "lucide-react";
import type { DashboardInvitationDTO } from "@/modules/invitation/server/dashboard-queries";
import type { CommercialUiState, InvitationLifecycle } from "@/modules/invitation/workspace-state";
import type { ActionResult } from "@/shared/types/action-result";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { DeleteInvitationButton } from "./delete-invitation-button";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function getDisplayName(couple: unknown): string {
  if (!couple || typeof couple !== "object") return "Nama pasangan belum diisi";
  const value = couple as { groom?: { name?: unknown }; bride?: { name?: unknown } };
  const groom = typeof value.groom?.name === "string" ? value.groom.name.trim() : "";
  const bride = typeof value.bride?.name === "string" ? value.bride.name.trim() : "";
  return groom && bride ? `${groom} & ${bride}` : groom || bride || "Nama pasangan belum diisi";
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

function getStatusLabel(lifecycle: InvitationLifecycle, commercial: CommercialUiState): string {
  if (lifecycle === "trashed") return "Sampah";
  if (commercial === "payment_review") return "Pembayaran perlu diperiksa";
  if (lifecycle === "expired") {
    return commercial === "pending_renewal" ? "Kedaluwarsa · Perpanjangan diproses" : "Kedaluwarsa";
  }
  if (lifecycle === "published") {
    if (commercial === "pending_upgrade") return "Terbit · Upgrade diproses";
    if (commercial === "pending_renewal") return "Terbit · Perpanjangan diproses";
    return "Sudah terbit";
  }
  if (commercial === "pending_initial_publish") return "Menunggu pembayaran";
  if (commercial === "entitlement_active") return "Paket aktif · Belum terbit";
  return "Draf";
}

export function DashboardInvitationCard({
  invitation,
  deleteInvitation,
}: {
  invitation: DashboardInvitationDTO;
  deleteInvitation: (id: string) => Promise<ActionResult<{ success: boolean }>>;
}) {
  const { workspace } = invitation;
  const actions = new Set(workspace.availableActions);
  const displayName = getDisplayName(invitation.couple);
  const updatedAt = formatDate(invitation.updatedAt);
  const expiresAt = formatDate(workspace.expiresAt);
  const statusLabel = getStatusLabel(workspace.effectiveLifecycle, workspace.commercialUiState);
  const needsAttention = workspace.effectiveLifecycle === "expired" || workspace.commercialUiState === "payment_review";

  return (
    <Card className="overflow-hidden rounded-2xl shadow-none transition-colors hover:border-foreground/20">
      <article className="grid sm:grid-cols-[9rem_minmax(0,1fr)]">
        <div className="relative aspect-[16/9] overflow-hidden border-b bg-muted sm:aspect-auto sm:min-h-48 sm:border-b-0 sm:border-r">
          {invitation.themePreviewImage ? (
            <Image
              src={invitation.themePreviewImage}
              alt={`Pratinjau tema ${invitation.themeName}`}
              fill
              sizes="(max-width: 639px) 100vw, 144px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full min-h-36 place-items-center text-muted-foreground">
              <ImageIcon className="size-6" aria-hidden="true" />
              <span className="sr-only">Pratinjau tema tidak tersedia</span>
            </div>
          )}
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="break-words text-lg font-semibold leading-snug">{displayName}</h3>
              <p className="mt-1 truncate font-mono text-sm text-muted-foreground" title={`/${invitation.slug}`}>
                /{invitation.slug}
              </p>
            </div>
            <Badge
              variant={needsAttention ? "destructive" : workspace.effectiveLifecycle === "published" ? "default" : "secondary"}
              className="shrink-0 whitespace-normal leading-snug"
            >
              {statusLabel}
            </Badge>
          </div>

          <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <div className="flex min-w-0 gap-1.5">
              <dt className="text-muted-foreground">Tema</dt>
              <dd className="truncate font-medium">{invitation.themeName}</dd>
            </div>
            {invitation.tierCode && (
              <div className="flex gap-1.5">
                <dt className="text-muted-foreground">Paket</dt>
                <dd className="font-medium uppercase">{invitation.tierCode}</dd>
              </div>
            )}
            {expiresAt && (
              <div className="flex gap-1.5">
                <dt className="text-muted-foreground">
                  {workspace.effectiveLifecycle === "expired" ? "Berakhir" : "Aktif sampai"}
                </dt>
                <dd className="font-medium">{expiresAt}</dd>
              </div>
            )}
            {updatedAt && (
              <div className="flex gap-1.5">
                <dt className="text-muted-foreground">Diedit</dt>
                <dd className="font-medium">{updatedAt}</dd>
              </div>
            )}
          </dl>

          {needsAttention && (
            <p className="mt-4 border-l-2 border-destructive pl-3 text-sm leading-relaxed text-muted-foreground">
              {workspace.commercialUiState === "payment_review"
                ? "Status pembayaran perlu diperiksa sebelum undangan dapat dilanjutkan."
                : "Masa aktif undangan telah berakhir. Edit dan pratinjau dinonaktifkan sampai tersedia tindakan pemulihan dari server."}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
            {actions.has("edit") && (
              <Button asChild className="h-11 px-4">
                <Link href={`/dashboard/${invitation.id}/edit`}>
                  <PencilLine aria-hidden="true" />
                  Lanjutkan Edit
                </Link>
              </Button>
            )}
            {actions.has("preview") && (
              <Button asChild variant="outline" className="h-11 px-4">
                <Link href={`/preview/${invitation.id}`} target="_blank" rel="noopener noreferrer">
                  <Eye aria-hidden="true" />
                  Pratinjau
                  <span className="sr-only"> (dibuka di tab baru)</span>
                </Link>
              </Button>
            )}
            {actions.has("view_public") && (
              <Button asChild variant="ghost" className="h-11 px-3">
                <Link href={`/${invitation.slug}`} target="_blank" rel="noopener noreferrer">
                  Buka Undangan
                  <ExternalLink aria-hidden="true" />
                  <span className="sr-only"> (dibuka di tab baru)</span>
                </Link>
              </Button>
            )}
            {actions.has("delete") && (
              <div className="ml-auto">
                <DeleteInvitationButton
                  id={invitation.id}
                  invitationName={displayName}
                  deleteInvitation={deleteInvitation}
                />
              </div>
            )}
          </div>
        </div>
      </article>
    </Card>
  );
}
