import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      dropoffLocationId,
      pickupLocationId,
      durationType,
      durationValue,
      items,
      airportPickup,
    } = body;

    if (!customerId || !dropoffLocationId || !pickupLocationId || !items?.length) {
      return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 });
    }

    // Static data for demo (would come from Supabase in production)
    const RATES: Record<string, Record<string, number>> = {
      'item-001': { daily: 1.00, weekly: 5.00, monthly: 25.00 },
      'item-002': { daily: 2.00, weekly: 10.00, monthly: 45.00 },
      'item-003': { daily: 3.50, weekly: 18.00, monthly: 75.00 },
      'item-004': { daily: 5.00, weekly: 25.00, monthly: 100.00 },
      'item-005': { daily: 4.00, weekly: 20.00, monthly: 85.00 },
    };

    const SURCHARGES: Record<string, { dropoff: number; pickup: number; requiresStripe: boolean }> = {
      'loc-001': { dropoff: 10, pickup: 10, requiresStripe: true },
      'loc-002': { dropoff: 0,  pickup: 0,  requiresStripe: false },
    };

    const dropoffSurcharge = SURCHARGES[dropoffLocationId]?.dropoff ?? 0;
    const pickupSurcharge  = SURCHARGES[pickupLocationId]?.pickup ?? 0;
    const requiresStripe   = SURCHARGES[dropoffLocationId]?.requiresStripe || SURCHARGES[pickupLocationId]?.requiresStripe;

    // Calculate base total
    let baseTotal = 0;
    for (const { tierId, qty } of items) {
      const rate = RATES[tierId]?.[durationType] ?? 0;
      baseTotal += rate * qty * durationValue;
    }

    const addonTotal  = airportPickup ? 5.00 : 0;
    const grandTotal  = baseTotal + dropoffSurcharge + pickupSurcharge + addonTotal;

    // Try to persist to Supabase
    let bookingId = `demo-${Date.now()}`;
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      const startDate = new Date();
      const endDate   = new Date();

      if (durationType === 'daily')   endDate.setDate(endDate.getDate() + durationValue);
      if (durationType === 'weekly')  endDate.setDate(endDate.getDate() + durationValue * 7);
      if (durationType === 'monthly') endDate.setMonth(endDate.getMonth() + durationValue);

      const { data: booking, error } = await supabase
        .from('bookings')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert([{
          customer_id:           customerId,
          dropoff_location_id:   dropoffLocationId,
          pickup_location_id:    pickupLocationId,
          duration_type:         durationType,
          duration_value:        durationValue,
          storage_start_date:    startDate.toISOString().split('T')[0],
          storage_end_date:      endDate.toISOString().split('T')[0],
          base_total_usd:        baseTotal,
          dropoff_surcharge_usd: dropoffSurcharge,
          pickup_surcharge_usd:  pickupSurcharge,
          addon_total_usd:       addonTotal,
          grand_total_usd:       grandTotal,
          payment_method:        requiresStripe ? 'stripe_simulated' : 'cash',
          payment_status:        'pending',
          booking_status:        'confirmed',
        }] as any)
        .select('id')
        .single() as { data: { id: string } | null, error: unknown };

      if (!error && booking) bookingId = booking.id;
    } catch {
      // Supabase not configured — use demo ID
    }

    return NextResponse.json({
      success: true,
      bookingId,
      grandTotal,
      requiresStripe,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
