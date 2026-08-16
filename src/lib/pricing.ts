/**
 * STOWAWAY — Shared Pricing Engine
 *
 * Single source of truth for all duration & pricing calculations.
 * Imported by both client components and server API routes to avoid drift.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Duration
// ─────────────────────────────────────────────────────────────────────────────

export type BillableUnit = 'hours' | 'days';

export interface DurationResult {
  billableUnit: BillableUnit;
  count: number;    // hours OR days
  label: string;    // "4 hours" | "2 days"
}

/**
 * Calculate billing duration from ISO datetime strings.
 *
 * Rules:
 *  - Same calendar day  → 1 Day (standard 1-day flat minimum)
 *  - Different calendar days → bill by calendar days touching boundaries:
 *      Same day (e.g. 10 AM to 2 PM) = 1 day
 *      10 PM Day-1 → 8 AM Day-2      = 2 days (crossing midnight into next day)
 *      10 AM Day-1 → 11 AM Day-2     = 2 days (passing 24 hours)
 */
export function calculateDuration(dropoffISO: string, pickupISO: string): DurationResult {
  if (!dropoffISO || !pickupISO) {
    return { billableUnit: 'days', count: 0, label: '' };
  }

  const dropoffDate = dropoffISO.split('T')[0];
  const pickupDate  = pickupISO.split('T')[0];

  const t1 = new Date(dropoffISO).getTime();
  const t2 = new Date(pickupISO).getTime();
  if (t2 < t1) return { billableUnit: 'days', count: 0, label: '' };

  if (dropoffDate === pickupDate) {
    // Same calendar day → 1 day minimum
    return {
      billableUnit: 'days',
      count: 1,
      label: '1 day',
    };
  }

  // Different calendar days → day billing
  const d1 = new Date(dropoffDate + 'T00:00:00').getTime();
  const d2 = new Date(pickupDate  + 'T00:00:00').getTime();

  if (d2 <= d1) return { billableUnit: 'days', count: 1, label: '1 day' };

  // +1 because crossing from Day 1 to Day 2 = 2 days
  const days = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  return {
    billableUnit: 'days',
    count: days,
    label: days === 1 ? '1 day' : `${days} days`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared tier interface (subset of full ItemTier — safe to import anywhere)
// ─────────────────────────────────────────────────────────────────────────────

export interface TierPricing {
  id: string;
  /** Standard per-day rate, used for bookings ≤ 7 days */
  rate_daily_usd: number;
  /**
   * Reduced per-day rate applied to ALL days when booking exceeds 7 days.
   * (Stored in rate_weekly_usd column; admin UI labels it "Day Rate (After 7 Days)")
   */
  rate_weekly_usd: number;
  /** Flat fee per item per booking when customer opts into insurance */
  insurance_fee_usd: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Effective rate helper
// ─────────────────────────────────────────────────────────────────────────────

const WEEK_THRESHOLD = 7; // days

export function effectiveDailyRate(tier: TierPricing, days: number): number {
  return days > WEEK_THRESHOLD ? tier.rate_weekly_usd : tier.rate_daily_usd;
}

// ─────────────────────────────────────────────────────────────────────────────
// Item fee
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate total item storage fee.
 * Daily billing with >7-day discount threshold.
 */
export function calculateItemFee(
  tiers: TierPricing[],
  quantities: Record<string, number>,
  duration: DurationResult,
): number {
  const tierMap = new Map(tiers.map((t) => [t.id, t]));
  const days = Math.max(1, duration.count || 1);

  return Object.entries(quantities).reduce((sum, [tierId, qty]) => {
    if (!qty || qty <= 0) return sum;
    const tier = tierMap.get(tierId);
    if (!tier) return sum;

    const rate = effectiveDailyRate(tier, days);
    return sum + rate * qty * days;
  }, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Insurance fee
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate total insurance fee.
 * = Σ(qty × tier.insurance_fee_usd) across all selected item types.
 * Returns 0 when insurance is not opted into.
 */
export function calculateInsuranceFee(
  tiers: TierPricing[],
  quantities: Record<string, number>,
  insuranceEnabled: boolean,
): number {
  if (!insuranceEnabled) return 0;
  const tierMap = new Map(tiers.map((t) => [t.id, t]));

  return Object.entries(quantities).reduce((sum, [tierId, qty]) => {
    if (!qty || qty <= 0) return sum;
    const tier = tierMap.get(tierId);
    return sum + (tier?.insurance_fee_usd ?? 0) * qty;
  }, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Grand total breakdown
// ─────────────────────────────────────────────────────────────────────────────

export interface PricingBreakdown {
  duration: DurationResult;
  itemFee: number;
  dropoffSurcharge: number;
  pickupSurcharge: number;
  airportServiceFee: number;
  insuranceFee: number;
  grandTotal: number;
}

export interface GrandTotalParams {
  tiers: TierPricing[];
  quantities: Record<string, number>;
  dropoffISO: string;
  pickupISO: string;
  dropoffSurchargeUsd: number;
  pickupSurchargeUsd: number;
  /** Auto-derived from location is_airport flag: pass addon fee or 0 */
  airportServiceFeeUsd: number;
  insuranceEnabled: boolean;
}

export function calculateGrandTotal(params: GrandTotalParams): PricingBreakdown {
  const duration        = calculateDuration(params.dropoffISO, params.pickupISO);
  const itemFee         = calculateItemFee(params.tiers, params.quantities, duration);
  const insuranceFee    = calculateInsuranceFee(params.tiers, params.quantities, params.insuranceEnabled);
  const grandTotal      =
    itemFee +
    params.dropoffSurchargeUsd +
    params.pickupSurchargeUsd +
    params.airportServiceFeeUsd +
    insuranceFee;

  return {
    duration,
    itemFee,
    dropoffSurcharge: params.dropoffSurchargeUsd,
    pickupSurcharge:  params.pickupSurchargeUsd,
    airportServiceFee: params.airportServiceFeeUsd,
    insuranceFee,
    grandTotal,
  };
}
