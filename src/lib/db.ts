import { createClient } from './supabase/server';

export interface BookingRecord {
  id: string;
  customerId: string;
  phone: string;
  fullName?: string;
  email?: string;
  passportNo?: string;
  notes?: string;
  dropoffLocationId: string | null;
  pickupLocationId: string | null;
  dropoffTime: string;
  pickupTime: string;
  items: { tierId: string; qty: number }[];
  insuranceEnabled: boolean;
  insuranceTotalUsd: number;
  airportServiceUsd: number;
  paymentMethod?: 'stripe' | 'cash';
  paymentStatus?: 'paid' | 'pending';
  status: 'confirmed' | 'in_transit' | 'deposited' | 'picked_up' | 'cancelled';
  grandTotalUsd: number;
  allowsCash?: boolean;
  isAirportBooking?: boolean;
  createdAt: string;
}

const MEMORY_BOOKINGS: BookingRecord[] = [];

export async function saveBooking(
  booking: Omit<BookingRecord, 'id' | 'createdAt' | 'status'>
): Promise<BookingRecord> {
  const isAirportInput = Boolean(
    booking.dropoffLocationId?.toLowerCase().includes('airport') ||
    booking.pickupLocationId?.toLowerCase().includes('airport') ||
    booking.dropoffLocationId?.toLowerCase().includes('cmb') ||
    booking.pickupLocationId?.toLowerCase().includes('cmb') ||
    booking.dropoffLocationId === 'loc-001' ||
    booking.pickupLocationId === 'loc-001' ||
    booking.dropoffLocationId === 'LOC_001' ||
    booking.pickupLocationId === 'LOC_001'
  );

  let isAirport = isAirportInput;

  const newRecord: BookingRecord = {
    ...booking,
    id: `bk-${Date.now().toString(36)}`,
    status: 'confirmed',
    allowsCash: !isAirport,
    isAirportBooking: isAirport,
    paymentMethod: isAirport ? 'stripe' : (booking.paymentMethod || 'cash'),
    paymentStatus: booking.paymentStatus || ((isAirport || booking.paymentMethod === 'stripe') ? 'paid' : 'pending'),
    createdAt: new Date().toISOString(),
  };

  MEMORY_BOOKINGS.push(newRecord);

  try {
    const supabase = await createClient();

    // 1. Resolve or create Customer record
    const phoneToUse = booking.phone?.trim() || `+9470000${Math.floor(100000 + Math.random() * 900000)}`;
    let customerUuid: string | null = null;

    const { data: existingCust } = await (supabase.from('customers') as any)
      .select('id')
      .eq('phone', phoneToUse)
      .maybeSingle();

    if (existingCust?.id) {
      customerUuid = existingCust.id;
      if (booking.fullName || booking.email || booking.passportNo) {
        await (supabase.from('customers') as any)
          .update({
            ...(booking.fullName ? { full_name: booking.fullName } : {}),
            ...(booking.email ? { email: booking.email } : {}),
            ...(booking.passportNo ? { passport_number: booking.passportNo } : {}),
          })
          .eq('id', customerUuid);
      }
    } else {
      const { data: newCust } = await (supabase.from('customers') as any)
        .insert({
          phone: phoneToUse,
          full_name: booking.fullName || 'Valued Customer',
          email: booking.email || undefined,
          passport_number: booking.passportNo || undefined,
        })
        .select('id')
        .single();
      if (newCust?.id) customerUuid = newCust.id;
    }

    // 2. Resolve Location UUIDs & check airport flags
    const { data: allLocations } = await (supabase.from('locations') as any).select('id, code, name, is_airport, requires_stripe, allows_cash');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const locMap: Record<string, string> = {};
    const locObjMap: Record<string, any> = {};
    if (allLocations) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allLocations.forEach((l: any) => {
        locMap[l.id]               = l.id;
        locMap[l.code]             = l.id;
        locMap[l.code.toLowerCase()] = l.id;
        locMap[l.name]             = l.id;
        locObjMap[l.id]            = l;
        locObjMap[l.code]          = l;
        locObjMap[l.name]          = l;
      });
    }

    const defaultLocId = allLocations && allLocations.length > 0 ? allLocations[0].id : null;
    const dropoffUuid  = (booking.dropoffLocationId && locMap[booking.dropoffLocationId]) || defaultLocId;
    const pickupUuid   = (booking.pickupLocationId  && locMap[booking.pickupLocationId])  || defaultLocId;

    const dObj = dropoffUuid ? locObjMap[dropoffUuid] : null;
    const pObj = pickupUuid ? locObjMap[pickupUuid] : null;
    if (dObj?.is_airport || pObj?.is_airport || dObj?.code === 'LOC_001' || pObj?.code === 'LOC_001' || dObj?.requires_stripe || pObj?.requires_stripe) {
      isAirport = true;
      newRecord.isAirportBooking = true;
      newRecord.allowsCash = false;
      newRecord.paymentMethod = 'stripe';
    }

    if (customerUuid && dropoffUuid && pickupUuid) {
      const startDateStr = booking.dropoffTime.includes('T')
        ? booking.dropoffTime.split('T')[0]
        : new Date().toISOString().split('T')[0];
      const endDateStr = booking.pickupTime.includes('T')
        ? booking.pickupTime.split('T')[0]
        : new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const { data: insertedBk, error: bkErr } = await (supabase.from('bookings') as any)
        .insert({
          customer_id:           customerUuid,
          dropoff_location_id:   dropoffUuid,
          pickup_location_id:    pickupUuid,
          duration_unit:         'days',
          duration_value:        1,
          dropoff_time:          booking.dropoffTime,
          pickup_time:           booking.pickupTime,
          storage_start_date:    startDateStr,
          storage_end_date:      endDateStr,
          airport_service_usd:   booking.airportServiceUsd,
          insurance_total_usd:   booking.insuranceTotalUsd,
          grand_total_usd:       booking.grandTotalUsd,
          payment_method:        (isAirport || booking.paymentMethod === 'stripe') ? 'stripe_simulated' : 'cash',
          payment_status:        booking.paymentStatus || ((isAirport || booking.paymentMethod === 'stripe') ? 'paid' : 'pending'),
          booking_status:        'confirmed',
          notes:                 booking.notes,
        })
        .select('id, created_at')
        .single();

      if (insertedBk?.id) {
        newRecord.id        = insertedBk.id;
        newRecord.createdAt = insertedBk.created_at || newRecord.createdAt;
        
        if (booking.items && booking.items.length > 0) {
          const itemsToInsert = booking.items.map(it => ({
            booking_id: insertedBk.id,
            tier_id: it.tierId,
            quantity: it.qty,
            unit_rate_usd: 0,
            line_total_usd: 0,
          }));
          await (supabase.from('booking_items') as any).insert(itemsToInsert);
        }
      }
    }
  } catch (e) {
    console.warn('Supabase saveBooking error:', e);
  }

  return newRecord;
}

export async function updateBookingPayment(
  id: string,
  paymentMethod: 'stripe' | 'cash',
  paymentStatus: 'paid' | 'pending'
): Promise<BookingRecord | null> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('bookings') as any)
      .update({
        payment_method: paymentMethod === 'stripe' ? 'stripe_simulated' : 'cash',
        payment_status: paymentStatus,
      })
      .eq('id', id);
  } catch (e) {
    console.warn('Supabase updateBookingPayment error:', e);
  }

  const booking = MEMORY_BOOKINGS.find((b) => b.id === id);
  if (booking) {
    booking.paymentMethod = paymentMethod;
    booking.paymentStatus = paymentStatus;
    return booking;
  }
  return null;
}

export async function getBookingsByPhone(phone: string): Promise<BookingRecord[]> {
  try {
    const supabase = await createClient();
    const cleanPhone = phone.trim();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bks } = await (supabase.from('bookings') as any)
      .select('*, customers!inner(*), booking_items(*), dropoff_loc:locations!dropoff_location_id(id, code, name, is_airport, allows_cash, requires_stripe), pickup_loc:locations!pickup_location_id(id, code, name, is_airport, allows_cash, requires_stripe)')
      .eq('customers.phone', cleanPhone)
      .order('created_at', { ascending: false });

    if (bks && bks.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return bks.map((b: any): BookingRecord => {
        const isAirport = Boolean(b.dropoff_loc?.is_airport || b.pickup_loc?.is_airport || b.dropoff_loc?.code === 'LOC_001' || b.pickup_loc?.code === 'LOC_001' || b.dropoff_location_id === 'loc-001' || b.pickup_location_id === 'loc-001');
        const allowsCash = !isAirport && b.dropoff_loc?.allows_cash !== false && b.pickup_loc?.allows_cash !== false;
        return {
          id:               b.id,
          customerId:       b.customer_id,
          phone:            b.customers?.phone || phone,
          fullName:         b.customers?.full_name,
          email:            b.customers?.email,
          passportNo:       b.customers?.passport_number,
          dropoffLocationId: b.dropoff_loc?.name || b.dropoff_location_id,
          pickupLocationId:  b.pickup_loc?.name  || b.pickup_location_id,
          dropoffTime:      b.dropoff_time || b.storage_start_date,
          pickupTime:       b.pickup_time  || b.storage_end_date,
          items:            b.booking_items ? b.booking_items.map((bi: any) => ({ tierId: bi.tier_id, qty: bi.quantity })) : [],
          insuranceEnabled: Number(b.insurance_total_usd) > 0,
          insuranceTotalUsd: Number(b.insurance_total_usd ?? 0),
          airportServiceUsd: Number(b.airport_service_usd ?? 0),
          paymentMethod:    b.payment_method === 'stripe_simulated' ? 'stripe' : 'cash',
          paymentStatus:    b.payment_status === 'paid' ? 'paid' : 'pending',
          status:           b.booking_status || 'confirmed',
          grandTotalUsd:    Number(b.grand_total_usd),
          allowsCash,
          isAirportBooking: isAirport,
          createdAt:        b.created_at,
        };
      });
    }
  } catch (e) {
    console.warn('Supabase getBookingsByPhone error:', e);
  }

  return MEMORY_BOOKINGS.filter((b) => b.phone.trim() === phone.trim());
}

export async function getBookingById(id: string): Promise<BookingRecord | null> {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: b } = await (supabase.from('bookings') as any)
      .select('*, customers!inner(*), booking_items(*), dropoff_loc:locations!dropoff_location_id(id, code, name, is_airport, allows_cash, requires_stripe), pickup_loc:locations!pickup_location_id(id, code, name, is_airport, allows_cash, requires_stripe)')
      .eq('id', id)
      .maybeSingle();

    if (b) {
      const isAirport = Boolean(b.dropoff_loc?.is_airport || b.pickup_loc?.is_airport || b.dropoff_loc?.code === 'LOC_001' || b.pickup_loc?.code === 'LOC_001' || b.dropoff_location_id === 'loc-001' || b.pickup_location_id === 'loc-001');
      const allowsCash = !isAirport && b.dropoff_loc?.allows_cash !== false && b.pickup_loc?.allows_cash !== false;

      return {
        id:               b.id,
        customerId:       b.customer_id,
        phone:            b.customers?.phone || '',
        fullName:         b.customers?.full_name || '',
        email:            b.customers?.email || '',
        passportNo:       b.customers?.passport_number || '',
        dropoffLocationId: b.dropoff_loc?.name || b.dropoff_location_id,
        pickupLocationId:  b.pickup_loc?.name  || b.pickup_location_id,
        dropoffTime:      b.dropoff_time || b.storage_start_date,
        pickupTime:       b.pickup_time  || b.storage_end_date,
        items:            b.booking_items ? b.booking_items.map((bi: any) => ({ tierId: bi.tier_id, qty: bi.quantity })) : [],
        insuranceEnabled: Number(b.insurance_total_usd) > 0,
        insuranceTotalUsd: Number(b.insurance_total_usd ?? 0),
        airportServiceUsd: Number(b.airport_service_usd ?? 0),
        paymentMethod:    (isAirport || b.payment_method === 'stripe_simulated') ? 'stripe' : 'cash',
        paymentStatus:    b.payment_status === 'paid' ? 'paid' : 'pending',
        status:           b.booking_status || 'confirmed',
        grandTotalUsd:    Number(b.grand_total_usd),
        allowsCash,
        isAirportBooking: isAirport,
        createdAt:        b.created_at,
      };
    }
  } catch (e) {
    console.warn('Supabase getBookingById error:', e);
  }

  return MEMORY_BOOKINGS.find((b) => b.id === id) ?? null;
}
