import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const FALLBACK_SLOTS = [
  { id: 'ts-1', label: '08:00 AM - 10:00 AM', start_time: '08:00', end_time: '10:00', is_active: true },
  { id: 'ts-2', label: '10:00 AM - 12:00 PM', start_time: '10:00', end_time: '12:00', is_active: true },
  { id: 'ts-3', label: '12:00 PM - 02:00 PM', start_time: '12:00', end_time: '14:00', is_active: true },
  { id: 'ts-4', label: '02:00 PM - 04:00 PM', start_time: '14:00', end_time: '16:00', is_active: true },
  { id: 'ts-5', label: '04:00 PM - 06:00 PM', start_time: '16:00', end_time: '18:00', is_active: true },
  { id: 'ts-6', label: '06:00 PM - 08:00 PM', start_time: '18:00', end_time: '20:00', is_active: true },
  { id: 'ts-7', label: '08:00 PM - 10:00 PM', start_time: '20:00', end_time: '22:00', is_active: true },
];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('time_slots').select('*').eq('is_active', true);
    if (!error && data && data.length > 0) {
      return NextResponse.json({ timeSlots: data });
    }
  } catch (e) {
    console.warn('Supabase fetch fallback for time_slots:', e);
  }
  return NextResponse.json({ timeSlots: FALLBACK_SLOTS });
}
