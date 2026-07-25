import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  actor: string;
  summary: string;
  created_at: string;
}

const MEMORY_AUDIT_LOG: AuditLogEntry[] = [
  { id: 'a1', table_name: 'time_slots', record_id: 'ts-1', action: 'UPDATE', actor: 'admin@stowaway.lk', summary: 'Configured weekday operational time slots', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'a2', table_name: 'item_tiers', record_id: 'item-005', action: 'INSERT', actor: 'admin@stowaway.lk', summary: 'Added ITEM_005 (Tea Chest Box)', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'a3', table_name: 'locations', record_id: 'loc-001', action: 'UPDATE', actor: 'admin@stowaway.lk', summary: 'Updated LOC_001 surcharges', created_at: new Date(Date.now() - 10800000).toISOString() },
];

export async function GET() {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dbLogs } = await (supabase.from('audit_log') as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (dbLogs && dbLogs.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted: AuditLogEntry[] = dbLogs.map((log: any) => ({
        id: log.id,
        table_name: log.table_name,
        record_id: log.record_id,
        action: log.action,
        actor: log.actor_id ? 'SuperAdmin' : 'admin@stowaway.lk',
        summary: log.new_values?.summary || `${log.action} on ${log.table_name} (${log.record_id})`,
        created_at: log.created_at,
      }));
      return NextResponse.json({ auditLogs: formatted });
    }
  } catch (e) {
    console.warn('Supabase fetch audit_log error:', e);
  }
  return NextResponse.json({ auditLogs: MEMORY_AUDIT_LOG });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tableName, recordId, action, summary, actor } = body;

    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      table_name: tableName || 'system',
      record_id: recordId || 'record',
      action: action || 'UPDATE',
      actor: actor || 'admin@stowaway.lk',
      summary: summary || `${action} on ${tableName}`,
      created_at: new Date().toISOString(),
    };

    MEMORY_AUDIT_LOG.unshift(entry);

    try {
      const supabase = await createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('audit_log') as any).insert({
        table_name: entry.table_name,
        record_id: entry.record_id,
        action: entry.action,
        new_values: { summary: entry.summary, actor: entry.actor },
      });
    } catch (e) {
      console.warn('Supabase insert audit_log error:', e);
    }

    return NextResponse.json({ success: true, entry });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to log audit entry' }, { status: 500 });
  }
}
