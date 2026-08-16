import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const FALLBACK_TIERS = [
  {
    id: 'item-001', code: 'ITEM_001',
    name: 'Small Bag / Documents',
    description: 'Laptops, handbags, document files, small carry-on items',
    supported_items: 'Laptop, handbag, document files, small carry-on',
    weight_spec: 'Max height 55 cm',
    icon_emoji: '💼',
    rate_daily_usd: 3.00,
    rate_weekly_usd: 2.40,
    insurance_fee_usd: 2.40,
    display_order: 1,
  },
  {
    id: 'item-002', code: 'ITEM_002',
    name: 'Medium / Large Bag',
    description: 'Standard carry-on suitcases, backpacks, trolleys',
    supported_items: 'Carry-on suitcases, backpacks, trolleys',
    weight_spec: 'Max height 75 cm, max 30 kg',
    icon_emoji: '🧳',
    rate_daily_usd: 4.00,
    rate_weekly_usd: 3.20,
    insurance_fee_usd: 2.40,
    display_order: 2,
  },
  {
    id: 'item-003', code: 'ITEM_003',
    name: 'XL Suitcase',
    description: 'Extra-large luggage, heavy check-in suitcases',
    supported_items: 'Extra-large luggage, heavy check-in suitcases',
    weight_spec: 'Max height 85 cm, max 40 kg',
    icon_emoji: '🗃️',
    rate_daily_usd: 5.00,
    rate_weekly_usd: 4.00,
    insurance_fee_usd: 2.40,
    display_order: 3,
  },
  {
    id: 'item-004', code: 'ITEM_004',
    name: 'Odd-Sized Items',
    description: 'Foldable bicycles, golf bags, baby car seats, surfboards',
    supported_items: 'Foldable bicycles, golf bags, baby car seats, surfboards',
    weight_spec: 'Non-standard dimensions',
    icon_emoji: '🚲',
    rate_daily_usd: 7.00,
    rate_weekly_usd: 5.50,
    insurance_fee_usd: 2.40,
    display_order: 4,
  },
];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('item_tiers')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (!error && data && data.length > 0) {
      return NextResponse.json({ itemTiers: data });
    }
  } catch (e) {
    console.warn('Supabase fetch fallback for item_tiers:', e);
  }
  return NextResponse.json({ itemTiers: FALLBACK_TIERS });
}
