import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '../route';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 });
    }

    const normalised = phone.replace(/\D/g, '');
    const stored = otpStore.get(normalised);

    if (!stored) {
      return NextResponse.json({ error: 'No OTP found. Please request a new code.' }, { status: 400 });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(normalised);
      return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
    }

    if (stored.code !== String(code)) {
      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
    }

    // Clear used OTP
    otpStore.delete(normalised);

    // Upsert customer record via Supabase
    // In MVP we return a stable customer ID derived from the phone (hashed)
    // A real implementation would use Supabase Auth or insert into customers table
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Check if customer exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .single() as { data: { id: string } | null, error: unknown };

    let customerId: string;

    if (existing) {
      customerId = existing.id;
      // Mark as verified
      await (supabase
        .from('customers') as unknown as { update: (v: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<void> } })
        .update({ verified_at: new Date().toISOString() })
        .eq('id', customerId);
    } else {
      const { data: created, error } = await supabase
        .from('customers')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert([{ phone, verified_at: new Date().toISOString() }] as any)
        .select('id')
        .single() as { data: { id: string } | null, error: unknown };

      if (error || !created) {
        // Fall back to a session-based ID for demo if Supabase isn't connected
        customerId = `demo-${normalised}`;
      } else {
        customerId = created.id;
      }
    }

    return NextResponse.json({ success: true, customerId });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
