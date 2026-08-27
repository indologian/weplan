export type TierCode = "basic" | "premium" | "vip";

export const TIER_ORDER: Record<TierCode, number> = {
  basic: 10,
  premium: 20,
  vip: 30,
};

export function compareTierRank(a: TierCode, b: TierCode): number {
  return TIER_ORDER[a] - TIER_ORDER[b];
}

export function isTierHigherOrEqual(a: TierCode, b: TierCode): boolean {
  return TIER_ORDER[a] >= TIER_ORDER[b];
}
