import { NextResponse } from 'next/server';
import { DEFAULT_TIME_SLOTS } from '@/lib/timeSlots';

export async function GET() {
  return NextResponse.json({ timeSlots: DEFAULT_TIME_SLOTS });
}
