import { createClient } from './supabase/client';

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
  airportPickup: boolean;
  paymentMethod?: 'stripe' | 'cash';
  paymentStatus?: 'paid' | 'pending';
  status: 'confirmed' | 'in_transit' | 'deposited' | 'picked_up' | 'cancelled';
  grandTotalUsd: number;
  createdAt: string;
}

const SEED_BOOKINGS: BookingRecord[] = [
  {
    id: 'bk-8921a4',
    customerId: 'cust-001',
    phone: '+94 77 555 1234',
    fullName: 'Pasan Dhanushka',
    email: 'pasan@stowaway.lk',
    passportNo: 'N9876543',
    dropoffLocationId: 'loc-001',
    pickupLocationId: 'loc-002',
    dropoffTime: '2026-07-27T10:00',
    pickupTime: '2026-07-29T14:00',
    items: [{ tierId: 'item-002', qty: 2 }, { tierId: 'item-004', qty: 1 }],
    airportPickup: true,
    paymentMethod: 'stripe',
    paymentStatus: 'paid',
    status: 'confirmed',
    grandTotalUsd: 33.00,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bk-4410e2',
    customerId: 'cust-002',
    phone: '+1 415 555 0199',
    fullName: 'Alex Rivera',
    email: 'alex.rivera@gmail.com',
    passportNo: 'A4829105',
    dropoffLocationId: 'loc-002',
    pickupLocationId: 'loc-001',
    dropoffTime: '2026-07-26T08:00',
    pickupTime: '2026-07-29T18:00',
    items: [{ tierId: 'item-003', qty: 1 }, { tierId: 'item-004', qty: 1 }],
    airportPickup: false,
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    status: 'deposited',
    grandTotalUsd: 42.50,
    createdAt: new Date().toISOString(),
  },
];

export async function saveBooking(booking: Omit<BookingRecord, 'id' | 'createdAt' | 'status'>): Promise<BookingRecord> {
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_PROJECT_ID');

  const newRecord: BookingRecord = {
    ...booking,
    id: `bk-${Date.now().toString(36)}`,
    status: 'confirmed',
    paymentMethod: booking.paymentMethod || 'cash',
    paymentStatus: booking.paymentStatus || (booking.paymentMethod === 'stripe' ? 'paid' : 'pending'),
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('bookings') as any).insert({
        customer_id: booking.customerId,
        dropoff_location_id: booking.dropoffLocationId,
        pickup_location_id: booking.pickupLocationId,
        duration_type: 'daily',
        duration_value: 2,
        storage_start_date: booking.dropoffTime.split('T')[0],
        storage_end_date: booking.pickupTime.split('T')[0],
        grand_total_usd: booking.grandTotalUsd,
        payment_method: booking.paymentMethod || 'cash',
        notes: booking.notes,
      }).select('id').single();

      if (!error && data?.id) {
        newRecord.id = data.id;
      }
    } catch (e) {
      console.warn('Supabase insert fallback to seed store:', e);
    }
  }

  SEED_BOOKINGS.unshift(newRecord);
  return newRecord;
}

export async function updateBookingPayment(id: string, paymentMethod: 'stripe' | 'cash', paymentStatus: 'paid' | 'pending'): Promise<BookingRecord | null> {
  const booking = SEED_BOOKINGS.find(b => b.id === id);
  if (booking) {
    booking.paymentMethod = paymentMethod;
    booking.paymentStatus = paymentStatus;
    return booking;
  }
  return null;
}

export async function getBookingsByPhone(phone: string): Promise<BookingRecord[]> {
  return SEED_BOOKINGS.filter(b => b.phone.trim() === phone.trim());
}

export async function getBookingById(id: string): Promise<BookingRecord | null> {
  const match = SEED_BOOKINGS.find(b => b.id === id);
  if (match) return match;
  
  if (id.startsWith('bk-')) {
    return {
      id,
      customerId: 'cust-001',
      phone: '+94 77 555 1234',
      fullName: 'Pasan Dhanushka',
      email: 'pasan@stowaway.lk',
      dropoffLocationId: 'loc-001',
      pickupLocationId: 'loc-001',
      dropoffTime: new Date().toISOString(),
      pickupTime: new Date(Date.now() + 86400000 * 2).toISOString(),
      items: [{ tierId: 'item-002', qty: 2 }, { tierId: 'item-004', qty: 1 }],
      airportPickup: true,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      status: 'confirmed',
      grandTotalUsd: 33.00,
      createdAt: new Date().toISOString(),
    };
  }
  return null;
}
