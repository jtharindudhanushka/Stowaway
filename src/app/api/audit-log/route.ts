import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/auth/guard';
import { fail, ok, serverError, NO_STORE } from '@/lib/api/http';

export const dynamic = 'force-dynamic';

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  actor: string;
  summary: string;
  created_at: string;
}

/**
 * GET /api/audit-log — SuperAdmin only.
 *
 * The POST endpoint that used to live here is gone. It accepted an
 * arbitrary `actor` string from an unauthenticated caller, so the trail
 * could be forged or flooded by anyone who found the URL. Entries are now
 * written only from server code via `writeAudit`, which takes the actor
 * from the verified session.
 */
export async function GET(req: Request) {
  try {
    await requireSuperAdmin();

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500);
    const table = url.searchParams.get('table');

    const supabase = createAdminClient();
    let query = supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (table) query = query.eq('table_name', table);

    const { data, error } = await query;
    if (error) {
      console.error('[audit-log.GET] failed:', error);
      throw serverError('We could not load the audit log.');
    }

    const entries: AuditLogEntry[] = (data ?? []).map((log) => ({
      id: log.id,
      table_name: log.table_name,
      record_id: log.record_id,
      action: log.action,
      actor: log.actor_email ?? 'system',
      summary: log.summary ?? `${log.action} on ${log.table_name}`,
      created_at: log.created_at,
    }));

    return ok({ auditLogs: entries }, NO_STORE);
  } catch (err) {
    return fail(err, 'audit-log.GET');
  }
}
