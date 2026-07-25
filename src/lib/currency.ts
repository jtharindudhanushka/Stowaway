/** Default fallback USD -> LKR exchange rate */
let currentLkrRate = Number(process.env.NEXT_PUBLIC_USD_TO_LKR ?? 320);

// Fetch live rate on browser load
if (typeof window !== 'undefined') {
  fetch('/api/exchange-rate')
    .then(res => res.json())
    .then(data => {
      if (data?.rate && typeof data.rate === 'number') {
        currentLkrRate = data.rate;
      }
    })
    .catch(() => {});
}

export function getExchangeRate(): number {
  return currentLkrRate;
}

/**
 * Format a USD amount as both currencies.
 * e.g. formatPrice(2.00) → "$2.00 / Rs. 640"
 */
export function formatPrice(usd: number): string {
  const lkr = Math.round(usd * currentLkrRate);
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
  const lkr = Math.round(usd * currentLkrRate);
  return `Rs. ${lkr.toLocaleString()}`;
}

/**
 * Format as compact dual-line display (for price summary cards).
 */
export function formatPriceCompact(usd: number): { usd: string; lkr: string } {
  const lkr = Math.round(usd * currentLkrRate);
  return {
    usd: `$${usd.toFixed(2)}`,
    lkr: `Rs. ${lkr.toLocaleString()}`,
  };
}
