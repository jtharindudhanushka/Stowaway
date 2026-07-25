import { NextResponse } from 'next/server';
import { saveBooking } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_TIER_RATES: Record<string, number> = {
  'item-001': 1.00,
  'item-002': 2.00,
  'item-003': 3.50,
  'item-004': 5.00,
  'item-005': 4.00,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerId,
      phone,
      fullName,
      email,
      passportNo,
      notes,
      dropoffLocationId,
      pickupLocationId,
      dropoffTime,
      pickupTime,
      items,
      airportPickup,
    } = body;

    // Backend Validation Checks
    if (!dropoffLocationId || !pickupLocationId) {
      return NextResponse.json({ error: 'Drop-off and pick-up locations are required.' }, { status: 400 });
    }

    if (!dropoffTime || !pickupTime) {
      return NextResponse.json({ error: 'Drop-off and pick-up times are required.' }, { status: 400 });
    }

    const tDrop = new Date(dropoffTime).getTime();
    const tPick = new Date(pickupTime).getTime();

    if (isNaN(tDrop) || isNaN(tPick) || tPick <= tDrop) {
      return NextResponse.json({ error: 'Pick-up time must be strictly after drop-off time.' }, { status: 400 });
    }

    const validItems = (items || []).filter((it: { qty: number }) => it.qty > 0);
    if (validItems.length === 0) {
      return NextResponse.json({ error: 'At least one item must be selected for storage.' }, { status: 400 });
    }

    // Calculate duration in days
    const diffHours = (tPick - tDrop) / (1000 * 60 * 60);
    const days = Math.max(1, Math.ceil(diffHours / 24));

    // Dynamic price calculation fetching live rates from Supabase
    let itemFee = 0;
    try {
      const supabase = await createClient();
      const { data: dbTiers } = await supabase.from('item_tiers').select('id, code, rate_daily_usd');
      const tierRateMap: Record<string, number> = {};
      if (dbTiers && dbTiers.length > 0) {
        dbTiers.forEach((t) => {
          tierRateMap[t.id] = Number(t.rate_daily_usd);
          tierRateMap[t.code] = Number(t.rate_daily_usd);
        });
      }

      itemFee = validItems.reduce((acc: number, it: { tierId: string; qty: number }) => {
        const rate = tierRateMap[it.tierId] ?? DEFAULT_TIER_RATES[it.tierId] ?? 3.50;
        return acc + it.qty * rate * days;
      }, 0);
    } catch {
      itemFee = validItems.reduce((acc: number, it: { tierId: string; qty: number }) => {
        const rate = DEFAULT_TIER_RATES[it.tierId] ?? 3.50;
        return acc + it.qty * rate * days;
      }, 0);
    }

    const addonFee = airportPickup ? 5.0 : 0.0;
    const locFee = (dropoffLocationId === 'loc-001' || dropoffLocationId === 'LOC_001' ? 10.0 : 0.0) +
                   (pickupLocationId === 'loc-001' || pickupLocationId === 'LOC_001' ? 10.0 : 0.0);
    const grandTotalUsd = itemFee + addonFee + locFee;

    const record = await saveBooking({
      customerId: customerId || 'cust-001',
      phone: phone || '',
      fullName: fullName || '',
      email: email || '',
      passportNo: passportNo || '',
      notes: notes || '',
      dropoffLocationId,
      pickupLocationId,
      dropoffTime,
      pickupTime,
      items: validItems,
      airportPickup: Boolean(airportPickup),
      grandTotalUsd,
    });

    return NextResponse.json({ success: true, bookingId: record.id, booking: record });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Server error processing booking' }, { status: 500 });
  }
}
