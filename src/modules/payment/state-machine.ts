import type { PaymentState } from "./types";

const VALID_TRANSITIONS: Record<PaymentState, readonly PaymentState[]> = {
  creating: ["provider_create_unknown", "awaiting_payment", "paid", "failed", "requires_review"],
  provider_create_unknown: ["awaiting_payment", "paid", "failed", "expired", "requires_review"],
  awaiting_payment: ["paid", "failed", "expired", "cancel_requested", "requires_review"],
  paid: ["partially_reversed", "reversed", "requires_review"],
  failed: ["requires_review"],
  expired: ["requires_review"],
  cancel_requested: ["cancelled", "awaiting_payment", "paid", "requires_review"],
  cancelled: ["requires_review"],
  partially_reversed: ["reversed", "requires_review"],
  reversed: ["requires_review"],
  requires_review: [],
};

export class InvalidStateTransitionError extends Error {
  constructor(
    public readonly from: PaymentState,
    public readonly to: PaymentState,
  ) {
    super(`Invalid payment state transition: ${from} → ${to}`);
    this.name = "InvalidStateTransitionError";
  }
}

export function canTransition(from: PaymentState, to: PaymentState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertValidTransition(from: PaymentState, to: PaymentState): void {
  if (!canTransition(from, to)) {
    throw new InvalidStateTransitionError(from, to);
  }
}
