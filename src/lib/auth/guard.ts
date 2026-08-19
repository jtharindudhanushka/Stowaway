import { createClient } from '@/lib/supabase/server';
import { forbidden, unauthorized } from '@/lib/api/http';

/**
 * Route-handler authorization.
 *
 * `src/proxy.ts` guards the /staff and /admin *pages*, but middleware does
 * not protect API routes — anyone could previously POST to /api/time-slots
 * or /api/audit-log unauthenticated. Every mutating route now calls one of
 * these guards before touching the service-role client.
 */

export type StaffRole = 'staff' | 'superadmin';

export interface Actor {
  userId: string;
  email: string;
  role: StaffRole;
}

const ADMIN_FALLBACK_EMAIL = 'admin@stowaway.lk';

function resolveRole(claims: Record<string, unknown>): StaffRole {
  const appMeta = claims['app_metadata'] as Record<string, unknown> | undefined;
  const userMeta = claims['user_metadata'] as Record<string, unknown> | undefined;
  const email = claims['email'] as string | undefined;

  const raw =
    (appMeta?.['role'] as string | undefined) ??
    (userMeta?.['role'] as string | undefined) ??
    (email === ADMIN_FALLBACK_EMAIL ? 'superadmin' : 'staff');

  return raw === 'superadmin' ? 'superadmin' : 'staff';
}

/** Resolve the signed-in portal user, or null when unauthenticated. */
export async function getActor(): Promise<Actor | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims as Record<string, unknown> | undefined;
    if (!claims) return null;

    const userId = (claims['sub'] as string | undefined) ?? '';
    const email = (claims['email'] as string | undefined) ?? '';
    if (!userId) return null;

    return { userId, email, role: resolveRole(claims) };
  } catch {
    return null;
  }
}

/** Any portal user (staff or superadmin). Throws ApiError otherwise. */
export async function requireStaff(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) throw unauthorized('You must be signed in to the staff portal.');
  return actor;
}

/** SuperAdmin only — pricing, locations, settings, audit. */
export async function requireSuperAdmin(): Promise<Actor> {
  const actor = await requireStaff();
  if (actor.role !== 'superadmin') {
    throw forbidden('This action requires SuperAdmin access.');
  }
  return actor;
}
