import { NextResponse } from 'next/server';

/**
 * Consistent HTTP envelope for every route handler.
 *
 * Two rules worth keeping:
 *  1. Client-visible messages never leak internal detail (SQL errors,
 *     stack traces, key names). Internals go to the server log only.
 *  2. Failures are reported as failures. The previous implementation
 *     swallowed Supabase errors with console.warn and still returned
 *     `success: true`, so customers saw confirmation pages for bookings
 *     that were never persisted.
 */

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code = 'error', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest   = (msg: string, details?: unknown) => new ApiError(400, msg, 'bad_request', details);
export const unauthorized = (msg = 'Authentication required.')  => new ApiError(401, msg, 'unauthorized');
export const forbidden    = (msg = 'You do not have access to this resource.') => new ApiError(403, msg, 'forbidden');
export const notFound     = (msg = 'Not found.')                => new ApiError(404, msg, 'not_found');
export const conflict     = (msg: string)                        => new ApiError(409, msg, 'conflict');
export const tooManyRequests = (msg = 'Too many requests. Please slow down and try again shortly.') =>
  new ApiError(429, msg, 'rate_limited');
export const serverError  = (msg = 'Something went wrong on our side. Please try again.') =>
  new ApiError(500, msg, 'server_error');

export function ok<T extends Record<string, unknown>>(payload: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, ...payload }, init);
}

/**
 * Turn a thrown value into a safe JSON response.
 * Anything that is not an ApiError is treated as an unexpected fault:
 * logged in full, reported to the client as a generic 500.
 */
export function fail(err: unknown, context: string) {
  if (err instanceof ApiError) {
    if (err.status >= 500) console.error(`[${context}]`, err);
    return NextResponse.json(
      { success: false, error: err.message, code: err.code, ...(err.details ? { details: err.details } : {}) },
      { status: err.status },
    );
  }

  console.error(`[${context}] Unhandled error:`, err);
  return NextResponse.json(
    { success: false, error: 'Something went wrong on our side. Please try again.', code: 'server_error' },
    { status: 500 },
  );
}

/** Best-effort client IP for rate limiting. */
export function clientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return h.get('x-real-ip') ?? h.get('cf-connecting-ip') ?? 'unknown';
}

/** Routes handling live data must never be cached at the edge. */
export const NO_STORE = { headers: { 'Cache-Control': 'no-store, max-age=0' } } as const;
