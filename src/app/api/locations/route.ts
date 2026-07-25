import { NextResponse } from 'next/server';

const LOCATIONS = [
  { id: 'loc-001', code: 'LOC_001', name: 'CMB Airport', dropoff_surcharge_usd: 10, pickup_surcharge_usd: 10, requires_stripe: true, allows_cash: false },
  { id: 'loc-002', code: 'LOC_002', name: 'Hotel Thilon, Colombo', dropoff_surcharge_usd: 0, pickup_surcharge_usd: 0, requires_stripe: false, allows_cash: true },
];

export async function GET() {
  return NextResponse.json({ locations: LOCATIONS });
}
