import "server-only";

import { createSupabaseServiceClient } from "@/shared/lib/supabase/service-client";
import {
  projectInvitationWorkspaceState,
  type InvitationLifecycle,
  type InvitationWorkspaceState,
  type WorkspacePaymentState,
  type WorkspaceTransactionType,
} from "../workspace-state";

export type DashboardInvitationDTO = {
  id: string;
  slug: string;
  couple: unknown;
  themeName: string;
  themePreviewImage: string | null;
  tierCode: string | null;
  updatedAt: string;
  publishedAt: string | null;
  workspace: InvitationWorkspaceState;
};

type InvitationRow = {
  id: string;
  slug: string;
  status: InvitationLifecycle;
  couple: unknown;
  theme_id: string;
  published_at: string | null;
  expires_at: string | null;
  entitlement_tier_id: string | null;
  updated_at: string;
  deleted_at: string | null;
};

type ThemeRow = {
  id: string;
  name: string;
  preview_image: string | null;
};

type TierRow = { id: string; code: string };

type TransactionRow = {
  invitation_id: string;
  transaction_type: WorkspaceTransactionType;
  payment_state: WorkspacePaymentState;
};

export async function getDashboardInvitations(userId: string): Promise<DashboardInvitationDTO[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("id,slug,status,couple,theme_id,published_at,expires_at,entitlement_tier_id,updated_at,deleted_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw new Error("Unable to load dashboard invitations");

  const invitations = (data ?? []) as InvitationRow[];
  if (invitations.length === 0) return [];

  const themeIds = [...new Set(invitations.map((invitation) => invitation.theme_id))];
  const tierIds = [
    ...new Set(
      invitations
        .map((invitation) => invitation.entitlement_tier_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const invitationIds = invitations.map((invitation) => invitation.id);

  const [themesResult, tiersResult, transactionsResult] = await Promise.all([
    supabase.from("themes").select("id,name,preview_image").in("id", themeIds),
    tierIds.length > 0
      ? supabase.from("tiers").select("id,code").in("id", tierIds)
      : Promise.resolve({ data: [] as TierRow[], error: null }),
    supabase
      .from("transactions")
      .select("invitation_id,transaction_type,payment_state,created_at")
      .in("invitation_id", invitationIds)
      .in("payment_state", [
        "creating",
        "provider_create_unknown",
        "awaiting_payment",
        "cancel_requested",
        "requires_review",
      ])
      .order("created_at", { ascending: false }),
  ]);

  if (themesResult.error || tiersResult.error || transactionsResult.error) {
    throw new Error("Unable to load dashboard invitation context");
  }

  const themes = new Map((themesResult.data as ThemeRow[]).map((theme) => [theme.id, theme]));
  const tiers = new Map((tiersResult.data as TierRow[]).map((tier) => [tier.id, tier.code]));
  const latestTransactions = new Map<string, TransactionRow>();

  for (const transaction of transactionsResult.data as TransactionRow[]) {
    if (!latestTransactions.has(transaction.invitation_id)) {
      latestTransactions.set(transaction.invitation_id, transaction);
    }
  }

  const now = new Date();
  return invitations.map((invitation) => {
    const theme = themes.get(invitation.theme_id);
    const transaction = latestTransactions.get(invitation.id);

    return {
      id: invitation.id,
      slug: invitation.slug,
      couple: invitation.couple,
      themeName: theme?.name ?? "Tema tidak tersedia",
      themePreviewImage: theme?.preview_image ?? null,
      tierCode: invitation.entitlement_tier_id
        ? tiers.get(invitation.entitlement_tier_id) ?? null
        : null,
      updatedAt: invitation.updated_at,
      publishedAt: invitation.published_at,
      workspace: projectInvitationWorkspaceState({
        status: invitation.status,
        entitlementTierId: invitation.entitlement_tier_id,
        expiresAt: invitation.expires_at,
        deletedAt: invitation.deleted_at,
        latestTransaction: transaction
          ? { type: transaction.transaction_type, state: transaction.payment_state }
          : null,
        now,
      }),
    };
  });
}
