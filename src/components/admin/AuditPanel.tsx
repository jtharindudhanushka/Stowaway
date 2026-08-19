'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { auditApi, AdminApiError, type AuditEntry } from '@/lib/admin/api';
import { notify } from '@/lib/toast';
import { PanelHeader, ErrorBanner, EmptyState, useDeferredLoad } from './primitives';
import { RefreshCw, Plus, Pencil, Archive } from 'lucide-react';

/**
 * Audit trail.
 *
 * Entries are written server-side only, with the actor taken from the
 * verified session — the previous build exposed a public POST endpoint
 * that accepted an arbitrary actor string, so the trail could be forged.
 * This screen is therefore read-only by construction.
 */

const ACTION_META: Record<AuditEntry['action'], { icon: React.ReactNode; tone: string; label: string }> = {
  INSERT: { icon: <Plus className="w-3.5 h-3.5" />, tone: 'bg-emerald-100 text-emerald-800', label: 'Created' },
  UPDATE: { icon: <Pencil className="w-3.5 h-3.5" />, tone: 'bg-blue-100 text-blue-800', label: 'Updated' },
  DELETE: { icon: <Archive className="w-3.5 h-3.5" />, tone: 'bg-amber-100 text-amber-800', label: 'Archived' },
};

const TABLE_LABELS: Record<string, string> = {
  item_tiers: 'Item Tiers',
  locations: 'Locations',
  addon_services: 'Add-ons',
  time_slots: 'Schedule',
  app_settings: 'Settings',
  bookings: 'Bookings',
};

export function AuditPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tableFilter, setTableFilter] = useState('');

  const load = useCallback(async (isManualRefresh?: boolean) => {
    setLoading(true);
    setError('');
    try {
      const { auditLogs } = await auditApi.list(200);
      setEntries(auditLogs);
      if (isManualRefresh) {
        notify.success('Audit log refreshed.');
      }
    } catch (e) {
      const msg = e instanceof AdminApiError ? e.message : 'Could not load the audit log.';
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useDeferredLoad(load);

  const tables = useMemo(() => [...new Set(entries.map((e) => e.table_name))].sort(), [entries]);
  const visible = tableFilter ? entries.filter((e) => e.table_name === tableFilter) : entries;

  /** Group by calendar day so a busy day reads as one block. */
  const byDay = useMemo(() => {
    const map = new Map<string, AuditEntry[]>();
    for (const e of visible) {
      const day = new Date(e.created_at).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const list = map.get(day);
      if (list) list.push(e);
      else map.set(day, [e]);
    }
    return [...map.entries()];
  }, [visible]);

  return (
    <div>
      <PanelHeader
        title="Audit Log"
        description="Every configuration and booking change, with the account that made it. Read-only."
        action={
          <button
            onClick={() => load(true)}
            aria-label="Refresh audit log"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100
                       transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
          </button>
        }
      />

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {tables.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-5">
          <button
            onClick={() => setTableFilter('')}
            aria-pressed={!tableFilter}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer',
              !tableFilter ? 'bg-[#1C130E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            Everything
          </button>
          {tables.map((t) => (
            <button
              key={t}
              onClick={() => setTableFilter(t)}
              aria-pressed={tableFilter === t}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer',
                tableFilter === t ? 'bg-[#1C130E] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              ].join(' ')}
            >
              {TABLE_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title="Nothing recorded yet"
          hint="Configuration changes and booking transitions will appear here as they happen."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {byDay.map(([day, items]) => (
            <section key={day}>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">{day}</h2>
              <ol className="flex flex-col gap-2">
                {items.map((entry) => {
                  const meta = ACTION_META[entry.action];
                  return (
                    <li
                      key={entry.id}
                      className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-start gap-3 shadow-2xs"
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${meta.tone}`}
                        title={meta.label}
                      >
                        {meta.icon}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 break-words">{entry.summary}</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                          <span className="font-bold text-slate-600">{entry.actor}</span>
                          {' · '}
                          {TABLE_LABELS[entry.table_name] ?? entry.table_name}
                        </p>
                      </div>

                      <time
                        dateTime={entry.created_at}
                        className="text-[11px] font-bold text-slate-400 tabular-nums flex-shrink-0"
                      >
                        {new Date(entry.created_at).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
