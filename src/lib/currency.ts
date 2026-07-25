/** Exchange rate — overridden by env var */
const USD_TO_LKR = Number(process.env.NEXT_PUBLIC_USD_TO_LKR ?? 320);

/**
 * Format a USD amount as both currencies.
 * e.g. formatPrice(2.00) → "$2.00 / Rs. 640"
 */
export function formatPrice(usd: number): string {
  const lkr = Math.round(usd * USD_TO_LKR);
  return `$${usd.toFixed(2)} / Rs. ${lkr.toLocaleString()}`;
}

/**
 * Format USD only.
 */
export function formatUSD(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

/**
 * Format LKR only.
 */
export function formatLKR(usd: number): string {
  const lkr = Math.round(usd * USD_TO_LKR);
  return `Rs. ${lkr.toLocaleString()}`;
}

/**
 * Format as compact dual-line display (for price summary cards).
 */
export function formatPriceCompact(usd: number): { usd: string; lkr: string } {
  const lkr = Math.round(usd * USD_TO_LKR);
  return {
    usd: `$${usd.toFixed(2)}`,
    lkr: `Rs. ${lkr.toLocaleString()}`,
  };
}
