import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Service-role Supabase client — SERVER ONLY.
 *
 * Bypasses RLS. Since migration 004 revoked all anon/authenticated write
 * grants, this is the only path that can mutate bookings, customers,
 * pricing or settings. Never import this from a component that runs in
 * the browser, and never expose the key via a NEXT_PUBLIC_ variable.
 *
 * Callers are responsible for their own authorization — reach for
 * `requireStaff` / `requireSuperAdmin` in `src/lib/auth/guard.ts` before
 * using this client in a route handler.
 */

let cached: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export class ServiceRoleUnavailableError extends Error {
  constructor() {
    super(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Server-side writes are ' +
        'disabled until it is set — see AGENTS.md > Environment Variables.',
    );
    this.name = 'ServiceRoleUnavailableError';
  }
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient() must never be called in the browser.');
  }
  if (!isServiceRoleConfigured()) {
    throw new ServiceRoleUnavailableError();
  }
  if (cached) return cached;

  cached = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { 'X-Client-Info': 'stowaway-server' } },
    },
  );
  return cached;
}

let publicCached: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function getDbClient() {
  if (typeof window !== 'undefined') {
    throw new Error('getDbClient() must never be called in the browser.');
  }
  if (isServiceRoleConfigured()) {
    return createAdminClient();
  }

  if (publicCached) return publicCached;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Supabase URL or Publishable/Anon key is not configured.');
  }

  publicCached = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    key,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { 'X-Client-Info': 'stowaway-public-server' } },
    },
  );
  return publicCached;
}

