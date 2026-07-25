import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface TimeSlotConfig {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  day_of_week?: string; // 'all' | '0' | '1' | '2' | '3' | '4' | '5' | '6'
  specific_date?: string | null; // e.g. '2026-07-27'
}

let MEMORY_TIME_SLOTS: TimeSlotConfig[] = [
  { id: 'ts-1', label: '08:00 AM - 10:00 AM', start_time: '08:00', end_time: '10:00', is_active: true, day_of_week: 'all' },
  { id: 'ts-2', label: '10:00 AM - 12:00 PM', start_time: '10:00', end_time: '12:00', is_active: true, day_of_week: 'all' },
  { id: 'ts-3', label: '12:00 PM - 02:00 PM', start_time: '12:00', end_time: '14:00', is_active: true, day_of_week: 'all' },
  { id: 'ts-4', label: '02:00 PM - 04:00 PM', start_time: '14:00', end_time: '16:00', is_active: true, day_of_week: 'all' },
  { id: 'ts-5', label: '04:00 PM - 06:00 PM', start_time: '16:00', end_time: '18:00', is_active: true, day_of_week: 'all' },
  { id: 'ts-6', label: '06:00 PM - 08:00 PM', start_time: '18:00', end_time: '20:00', is_active: true, day_of_week: 'all' },
  { id: 'ts-7', label: '08:00 PM - 10:00 PM', start_time: '20:00', end_time: '22:00', is_active: true, day_of_week: 'all' },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dbSlots } = await (supabase.from('time_slots') as any).select('*');

    const sourceSlots: TimeSlotConfig[] = dbSlots && dbSlots.length > 0 ? dbSlots : MEMORY_TIME_SLOTS;

    if (dateStr) {
      // 1. Check for specific date overrides
      const dateOverrides = sourceSlots.filter(s => s.specific_date === dateStr && s.is_active);
      if (dateOverrides.length > 0) {
        return NextResponse.json({ timeSlots: dateOverrides, isOverride: true, date: dateStr });
      }

      // 2. Fallback to weekday default slots
      const dayOfWeek = new Date(dateStr).getDay().toString(); // 0 = Sun, 1 = Mon ...
      const weekdaySlots = sourceSlots.filter(s =>
        s.is_active && (!s.specific_date) && (s.day_of_week === 'all' || s.day_of_week === dayOfWeek || !s.day_of_week)
      );

      return NextResponse.json({ timeSlots: weekdaySlots.length > 0 ? weekdaySlots : sourceSlots.filter(s => s.is_active), isOverride: false, date: dateStr });
    }

    return NextResponse.json({ timeSlots: sourceSlots });
  } catch (e) {
    console.warn('Supabase fetch time_slots error:', e);
    return NextResponse.json({ timeSlots: MEMORY_TIME_SLOTS });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { timeSlots } = body;

    if (Array.isArray(timeSlots)) {
      MEMORY_TIME_SLOTS = timeSlots;

      try {
        const supabase = await createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const slot of timeSlots) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('time_slots') as any).upsert({
            id: slot.id?.startsWith('slot-') || slot.id?.startsWith('ts-') ? undefined : slot.id,
            label: slot.label,
            start_time: slot.start_time || slot.startTime,
            end_time: slot.end_time || slot.endTime,
            is_active: slot.is_active ?? slot.active ?? true,
          });
        }
      } catch (e) {
        console.warn('Supabase upsert time_slots error:', e);
      }
    }

    return NextResponse.json({ success: true, timeSlots: MEMORY_TIME_SLOTS });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save time slots' }, { status: 500 });
  }
}
