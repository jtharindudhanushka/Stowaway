import { NextResponse } from 'next/server';

const ITEM_TIERS = [
  { id: 'item-001', code: 'ITEM_001', name: 'Small Bag / Documents', description: 'Laptops, handbags, document files', supported_items: 'Laptop, handbag, document files', weight_spec: 'Standard personal item', icon_emoji: '💼', rate_daily_usd: 1.00, rate_weekly_usd: 5.00, rate_monthly_usd: 25.00 },
  { id: 'item-002', code: 'ITEM_002', name: 'Carry-On Luggage', description: 'Standard carry-on, trolleys', supported_items: 'Carry-on suitcases, backpacks', weight_spec: 'Max 15 kg', icon_emoji: '🧳', rate_daily_usd: 2.00, rate_weekly_usd: 10.00, rate_monthly_usd: 45.00 },
  { id: 'item-003', code: 'ITEM_003', name: 'Large Suitcase', description: 'Check-in luggage', supported_items: 'Extra-large luggage, check-in suitcases', weight_spec: 'Max 40 kg', icon_emoji: '🗃️', rate_daily_usd: 3.50, rate_weekly_usd: 18.00, rate_monthly_usd: 75.00 },
  { id: 'item-004', code: 'ITEM_004', name: 'Odd-Sized Items', description: 'Bicycles, golf bags', supported_items: 'Foldable bicycles, golf bags, surfboards', weight_spec: 'Non-standard dimensions', icon_emoji: '🚲', rate_daily_usd: 5.00, rate_weekly_usd: 25.00, rate_monthly_usd: 100.00 },
  { id: 'item-005', code: 'ITEM_005', name: 'Tea Chest Box', description: 'Storage crates', supported_items: 'Standard tea chest boxes', weight_spec: 'Heavy / bulky volume', icon_emoji: '📦', rate_daily_usd: 4.00, rate_weekly_usd: 20.00, rate_monthly_usd: 85.00 },
];

export async function GET() {
  return NextResponse.json({ itemTiers: ITEM_TIERS });
}
