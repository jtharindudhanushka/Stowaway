import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const FALLBACK_LOCATIONS = [
  { id: 'loc-001', code: 'LOC_001', name: 'CMB Airport Storage Hub', is_airport: true, dropoff_surcharge_usd: 10, pickup_surcharge_usd: 10, requires_stripe: true, allows_cash: false },
  { id: 'loc-002', code: 'LOC_002', name: 'Hotel Thilon Drop Point', is_airport: false, dropoff_surcharge_usd: 0, pickup_surcharge_usd: 0, requires_stripe: false, allows_cash: true },
];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('locations').select('*').eq('is_active', true).order('code');
    if (!error && data && data.length > 0) {
      return NextResponse.json({ locations: data });
    }
  } catch (e) {
    console.warn('Supabase fetch fallback for locations:', e);
  }
  return NextResponse.json({ locations: FALLBACK_LOCATIONS });
}
