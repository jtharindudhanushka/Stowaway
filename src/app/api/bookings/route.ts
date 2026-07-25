import { NextResponse } from 'next/server';
import { saveBooking } from '@/lib/db';

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

    // Calculate estimated total
    const itemFee = (items || []).reduce((acc: number, it: { qty: number }) => acc + (it.qty * 3.5), 0);
    const addonFee = airportPickup ? 5.0 : 0.0;
    const locFee = dropoffLocationId === 'loc-001' ? 10.0 : 0.0;
    const grandTotalUsd = itemFee + addonFee + locFee;

    const record = await saveBooking({
      customerId: customerId || 'demo-cust',
      phone: phone || '+94 77 123 4567',
      fullName,
      email,
      passportNo,
      notes,
      dropoffLocationId,
      pickupLocationId,
      dropoffTime,
      pickupTime,
      items,
      airportPickup: Boolean(airportPickup),
      grandTotalUsd,
    });

    return NextResponse.json({ success: true, bookingId: record.id, booking: record });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
