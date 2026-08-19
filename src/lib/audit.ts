import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import type { Actor } from '@/lib/auth/guard';

/**
 * Server-side audit trail.
 *
 * The old /api/audit-log POST endpoint accepted an arbitrary `actor` string
 * from an unauthenticated caller, so the trail could be forged or spammed.
 * Entries are now written only from server code, and the actor is taken
 * from the verified session — never from the request body.
 */

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditInput {
  tableName: string;
  recordId: string;
  action: AuditAction;
  summary: string;
  actor: Actor;
  oldValues?: unknown;
  newValues?: unknown;
}

/**
 * Best-effort: a failed audit write is logged but never fails the
 * business operation that triggered it.
 */
export async function writeAudit(input: AuditInput): Promise<void> {
  if (!isServiceRoleConfigured()) return;

  try {
    const supabase = createAdminClient();
    await supabase.from('audit_log').insert({
      table_name: input.tableName,
      record_id: input.recordId,
      action: input.action,
      actor_id: input.actor.userId || null,
      actor_email: input.actor.email || null,
      summary: input.summary,
      old_values: (input.oldValues ?? null) as never,
      new_values: (input.newValues ?? null) as never,
    } as never);
  } catch (e) {
    console.error('[audit] failed to record entry:', input.tableName, input.recordId, e);
  }
}

/** Redact fields that should never land in the audit trail. */
const SENSITIVE_KEYS = new Set(['passport_number', 'otp_code', 'email', 'phone']);

export function redact<T extends Record<string, unknown>>(obj: T | null | undefined): Partial<T> | null {
  if (!obj) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = SENSITIVE_KEYS.has(k) ? '[redacted]' : v;
  }
  return out as Partial<T>;
}
