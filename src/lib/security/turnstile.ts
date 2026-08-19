import { badRequest } from '@/lib/api/http';

/**
 * Cloudflare Turnstile server-side verification.
 *
 * Enabled by the `turnstile_enabled` app setting AND the presence of
 * TURNSTILE_SECRET_KEY. Both must be true — a setting flipped on without
 * the key configured would otherwise lock out every customer.
 *
 * Env:
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY  — widget key, safe to expose
 *   TURNSTILE_SECRET_KEY            — server secret, never exposed
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify a Turnstile token. Throws ApiError(400) when the challenge fails.
 * No-ops when Turnstile is not configured/enabled so local dev is unaffected.
 */
export async function verifyTurnstile(
  token: string | undefined,
  opts: { enabled: boolean; remoteIp?: string },
): Promise<void> {
  if (!opts.enabled || !isTurnstileConfigured()) return;

  if (!token) {
    throw badRequest('Please complete the verification challenge before continuing.');
  }

  const body = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY!,
    response: token,
  });
  if (opts.remoteIp && opts.remoteIp !== 'unknown') body.set('remoteip', opts.remoteIp);

  let result: TurnstileResponse;
  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      // Don't let a Cloudflare hiccup hang the booking request forever.
      signal: AbortSignal.timeout(8000),
    });
    result = (await res.json()) as TurnstileResponse;
  } catch (e) {
    // Fail closed: a challenge we cannot verify is not a passed challenge.
    console.error('[turnstile] verification request failed:', e);
    throw badRequest('We could not verify your request right now. Please try again in a moment.');
  }

  if (!result.success) {
    console.warn('[turnstile] rejected:', result['error-codes']);
    throw badRequest('Verification failed. Please refresh the page and try again.');
  }
}
