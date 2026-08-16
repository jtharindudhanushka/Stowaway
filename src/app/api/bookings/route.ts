import { NextResponse } from 'next/server';
import { saveBooking } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { calculateGrandTotal, type TierPricing } from '@/lib/pricing';
import { getBookingsByPhone } from '@/lib/db';

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
      insuranceEnabled,
    } = body;

    // ── Validation ──────────────────────────────────────────────
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

    // ── Fetch pricing data from DB ──────────────────────────────
    const supabase = await createClient();

    // Item tiers (for price calculation)
    const { data: dbTiers } = await (supabase.from('item_tiers') as any)
      .select('id, code, rate_daily_usd, rate_weekly_usd, insurance_fee_usd');

    const tierFallback: Record<string, TierPricing> = {
      'item-001': { id: 'item-001', rate_daily_usd: 3.00, rate_weekly_usd: 2.40, insurance_fee_usd: 2.40 },
      'item-002': { id: 'item-002', rate_daily_usd: 4.00, rate_weekly_usd: 3.20, insurance_fee_usd: 2.40 },
      'item-003': { id: 'item-003', rate_daily_usd: 5.00, rate_weekly_usd: 4.00, insurance_fee_usd: 2.40 },
      'item-004': { id: 'item-004', rate_daily_usd: 7.00, rate_weekly_usd: 5.50, insurance_fee_usd: 2.40 },
      'item-005': { id: 'item-005', rate_daily_usd: 4.00, rate_weekly_usd: 3.20, insurance_fee_usd: 2.40 },
    };

    const tiers: TierPricing[] = dbTiers && dbTiers.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? dbTiers.map((t: any) => ({
          id:                t.id,
          rate_daily_usd:    Number(t.rate_daily_usd),
          rate_weekly_usd:   Number(t.rate_weekly_usd),
          insurance_fee_usd: Number(t.insurance_fee_usd ?? 2.40),
        }))
      : Object.values(tierFallback);

    // Build tier lookup by id + code
    const tierMap = new Map<string, TierPricing>();
    if (dbTiers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dbTiers.forEach((t: any) => {
        const pricing: TierPricing = {
          id:                t.id,
          rate_daily_usd:    Number(t.rate_daily_usd),
          rate_weekly_usd:   Number(t.rate_weekly_usd),
          insurance_fee_usd: Number(t.insurance_fee_usd ?? 2.40),
        };
        tierMap.set(t.id, pricing);
        tierMap.set(t.code, pricing);
      });
    } else {
      Object.entries(tierFallback).forEach(([k, v]) => tierMap.set(k, v));
    }

    // Resolve item tier IDs to pricing objects
    const quantities: Record<string, number> = {};
    for (const it of validItems) {
      const resolved = tierMap.get(it.tierId);
      if (resolved) {
        quantities[resolved.id] = it.qty;
      }
    }

    // Locations (for surcharges + airport auto-detection)
    const { data: locData } = await (supabase.from('locations') as any)
      .select('id, code, is_airport, dropoff_surcharge_usd, pickup_surcharge_usd')
      .in('id', [dropoffLocationId, pickupLocationId]);

    const locMap = new Map<string, { is_airport: boolean; dropoff_surcharge_usd: number; pickup_surcharge_usd: number }>();
    if (locData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      locData.forEach((l: any) => {
        locMap.set(l.id, {
          is_airport:            Boolean(l.is_airport),
          dropoff_surcharge_usd: Number(l.dropoff_surcharge_usd),
          pickup_surcharge_usd:  Number(l.pickup_surcharge_usd),
        });
      });
    }

    const dropoffLoc = locMap.get(dropoffLocationId);
    const pickupLoc  = locMap.get(pickupLocationId);

    const dropoffSurcharge = dropoffLoc?.dropoff_surcharge_usd ?? 0;
    const pickupSurcharge  = pickupLoc?.pickup_surcharge_usd  ?? 0;

    // Auto-derive airport service fee from location data
    const isAirportBooking = Boolean(dropoffLoc?.is_airport || pickupLoc?.is_airport);
    let airportServiceUsd = 0;
    if (isAirportBooking) {
      const { data: addon } = await (supabase.from('addon_services') as any)
        .select('fee_usd')
        .eq('code', 'ADDON_001')
        .maybeSingle();
      airportServiceUsd = Number(addon?.fee_usd ?? 5.00);
    }

    // ── Grand total via shared pricing engine ───────────────────
    const breakdown = calculateGrandTotal({
      tiers: Object.keys(quantities).map((id) => tierMap.get(id) ?? { id, rate_daily_usd: 3.00, rate_weekly_usd: 2.40, insurance_fee_usd: 2.40 }),
      quantities,
      dropoffISO:           dropoffTime,
      pickupISO:            pickupTime,
      dropoffSurchargeUsd:  dropoffSurcharge,
      pickupSurchargeUsd:   pickupSurcharge,
      airportServiceFeeUsd: airportServiceUsd,
      insuranceEnabled:     Boolean(insuranceEnabled),
    });

    // ── Save booking ────────────────────────────────────────────
    const record = await saveBooking({
      customerId:       customerId || 'cust-001',
      phone:            phone || '',
      fullName:         fullName || '',
      email:            email || '',
      passportNo:       passportNo || '',
      notes:            notes || '',
      dropoffLocationId,
      pickupLocationId,
      dropoffTime,
      pickupTime,
      items: validItems,
      insuranceEnabled: Boolean(insuranceEnabled),
      insuranceTotalUsd: breakdown.insuranceFee,
      airportServiceUsd,
      grandTotalUsd:    breakdown.grandTotal,
      paymentMethod:    isAirportBooking ? 'stripe' : 'cash',
    });

    return NextResponse.json({ success: true, bookingId: record.id, booking: record, breakdown });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error processing booking' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    if (!phone) return NextResponse.json({ bookings: [] });

    const records = await getBookingsByPhone(phone);
    return NextResponse.json({ bookings: records });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
