import { NextRequest, NextResponse } from 'next/server';

// Demo OTP: stored in-memory for MVP (no real SMS)
// In production, use Redis or a DB-backed store
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const normalised = phone.replace(/\D/g, '');
    if (normalised.length < 7) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    // Generate 4-digit demo OTP
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(normalised, { code, expiresAt });

    // In demo mode, return the code in the response for on-screen display
    return NextResponse.json({
      success: true,
      demoCode: code,  // DEMO ONLY — remove in production
      expiresIn: 600,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Named export so /api/auth/otp can also be used for verification at a sub-path
export { otpStore };
