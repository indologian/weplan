export type InvitationLifecycle = "draft" | "published" | "expired" | "trashed";

export type WorkspaceTransactionType =
  | "initial_publish"
  | "tier_upgrade"
  | "renewal"
  | "draft_extension";

export type WorkspacePaymentState =
  | "creating"
  | "provider_create_unknown"
  | "awaiting_payment"
  | "paid"
  | "failed"
  | "expired"
  | "cancel_requested"
  | "cancelled"
  | "partially_reversed"
  | "reversed"
  | "requires_review";

export type CommercialUiState =
  | "none"
  | "pending_initial_publish"
  | "pending_upgrade"
  | "pending_renewal"
  | "entitlement_active"
  | "payment_review";

export type InvitationWorkspaceAction = "edit" | "preview" | "view_public" | "delete";

export type InvitationWorkspaceState = {
  effectiveLifecycle: InvitationLifecycle;
  commercialUiState: CommercialUiState;
  editable: boolean;
  availableActions: InvitationWorkspaceAction[];
  expiresAt?: string;
};

type WorkspaceStateInput = {
  status: InvitationLifecycle;
  entitlementTierId: string | null;
  expiresAt: string | null;
  deletedAt: string | null;
  latestTransaction?: {
    type: WorkspaceTransactionType;
    state: WorkspacePaymentState;
  } | null;
  now?: Date;
};

const PENDING_PAYMENT_STATES = new Set<WorkspacePaymentState>([
  "creating",
  "awaiting_payment",
]);

const REVIEW_PAYMENT_STATES = new Set<WorkspacePaymentState>([
  "provider_create_unknown",
  "cancel_requested",
  "requires_review",
]);

function getCommercialUiState(input: WorkspaceStateInput): CommercialUiState {
  const transaction = input.latestTransaction;
  if (transaction && REVIEW_PAYMENT_STATES.has(transaction.state)) return "payment_review";

  if (transaction && PENDING_PAYMENT_STATES.has(transaction.state)) {
    if (transaction.type === "initial_publish") return "pending_initial_publish";
    if (transaction.type === "tier_upgrade") return "pending_upgrade";
    if (transaction.type === "renewal") return "pending_renewal";
  }

  return input.entitlementTierId ? "entitlement_active" : "none";
}

export function projectInvitationWorkspaceState(input: WorkspaceStateInput): InvitationWorkspaceState {
  const now = input.now ?? new Date();
  const hasExpiredEntitlement = Boolean(
    input.entitlementTierId
      && input.expiresAt
      && new Date(input.expiresAt).getTime() <= now.getTime(),
  );

  const effectiveLifecycle: InvitationLifecycle = input.deletedAt || input.status === "trashed"
    ? "trashed"
    : input.status === "expired" || hasExpiredEntitlement
      ? "expired"
      : input.status;

  const editable = effectiveLifecycle === "draft" || effectiveLifecycle === "published";
  const availableActions: InvitationWorkspaceAction[] = [];

  if (editable) availableActions.push("edit", "preview");
  if (effectiveLifecycle === "published") availableActions.push("view_public");
  if (effectiveLifecycle !== "trashed") availableActions.push("delete");

  return {
    effectiveLifecycle,
    commercialUiState: getCommercialUiState(input),
    editable,
    availableActions,
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
  };
}
