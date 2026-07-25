import { NextResponse } from 'next/server';

let cachedRate = 320;
let lastFetched = 0;
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function GET() {
  const now = Date.now();
  if (now - lastFetched < CACHE_DURATION_MS && cachedRate > 0) {
    return NextResponse.json({ success: true, rate: cachedRate, source: 'cache' });
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 21600 }, // 6 hours
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.LKR) {
        cachedRate = Math.round(data.rates.LKR * 100) / 100;
        lastFetched = now;
        return NextResponse.json({ success: true, rate: cachedRate, source: 'open.er-api.com' });
      }
    }
  } catch (err) {
    console.warn('Primary exchange rate API failed, trying fallback:', err);
  }

  try {
    const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
    if (res.ok) {
      const data = await res.json();
      if (data?.usd?.lkr) {
        cachedRate = Math.round(data.usd.lkr * 100) / 100;
        lastFetched = now;
        return NextResponse.json({ success: true, rate: cachedRate, source: 'currency-api' });
      }
    }
  } catch (err) {
    console.warn('Fallback exchange rate API failed:', err);
  }

  return NextResponse.json({ success: true, rate: cachedRate, source: 'fallback-static' });
}
