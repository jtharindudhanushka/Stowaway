import { getSettings } from '@/lib/settings';
import { fail, ok } from '@/lib/api/http';

export const dynamic = 'force-dynamic';

/**
 * USD → LKR rate for the dual-currency display.
 *
 * Honours the `exchange_rate_live` app setting: an operator who wants a
 * fixed rate for a pricing period can switch the live feed off and pin
 * `usd_to_lkr_rate` from the admin panel.
 *
 * Both upstream calls are bounded by a timeout — a hanging currency API
 * should never hold a page render open.
 */

let cachedRate: number | null = null;
let lastFetched = 0;
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;
const UPSTREAM_TIMEOUT_MS = 5000;

const SOURCES: { name: string; url: string; extract: (d: unknown) => number | undefined }[] = [
  {
    name: 'open.er-api.com',
    url: 'https://open.er-api.com/v6/latest/USD',
    extract: (d) => (d as { rates?: { LKR?: number } })?.rates?.LKR,
  },
  {
    name: 'currency-api',
    url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
    extract: (d) => (d as { usd?: { lkr?: number } })?.usd?.lkr,
  },
];

function isPlausible(rate: number | undefined): rate is number {
  // Guard against a malformed upstream response silently repricing the
  // whole catalogue — LKR has never been near these bounds.
  return typeof rate === 'number' && Number.isFinite(rate) && rate > 50 && rate < 2000;
}

export async function GET() {
  try {
    const settings = await getSettings();
    const fallback = settings.usd_to_lkr_rate;

    if (!settings.exchange_rate_live) {
      return ok({ rate: fallback, source: 'admin-fixed' });
    }

    const now = Date.now();
    if (cachedRate && now - lastFetched < CACHE_DURATION_MS) {
      return ok({ rate: cachedRate, source: 'cache' });
    }

    for (const source of SOURCES) {
      try {
        const res = await fetch(source.url, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
        if (!res.ok) continue;
        const rate = source.extract(await res.json());
        if (isPlausible(rate)) {
          cachedRate = Math.round(rate * 100) / 100;
          lastFetched = now;
          return ok({ rate: cachedRate, source: source.name });
        }
      } catch (err) {
        console.warn(`[exchange-rate] ${source.name} unavailable:`, err);
      }
    }

    // Serve the last good value if we have one, otherwise the admin default.
    return ok({ rate: cachedRate ?? fallback, source: cachedRate ? 'stale-cache' : 'admin-fallback' });
  } catch (err) {
    return fail(err, 'exchange-rate.GET');
  }
}
