import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const FALLBACK_ADDONS = [
  { id: 'addon-001', code: 'ADDON_001', name: 'Airport Pickup / Delivery Service', fee_usd: 5.00, is_active: true },
  { id: 'addon-002', code: 'ADDON_002', name: 'Express 24/7 Priority Handling', fee_usd: 3.00, is_active: true },
];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('addon_services').select('*').eq('is_active', true).order('code');
    if (!error && data && data.length > 0) {
      return NextResponse.json({ addons: data });
    }
  } catch (e) {
    console.warn('Supabase fetch fallback for addon_services:', e);
  }
  return NextResponse.json({ addons: FALLBACK_ADDONS });
}
