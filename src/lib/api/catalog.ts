import type { z } from 'zod';
import { createAdminClient, getDbClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/auth/guard';
import { writeAudit } from '@/lib/audit';
import { parseBody } from '@/lib/validation/schemas';
import { badRequest, conflict, fail, notFound, ok, serverError, NO_STORE } from '@/lib/api/http';
import { invalidateSettingsCache } from '@/lib/settings';

/**
 * CRUD factory for the admin-managed catalog tables (item_tiers, locations,
 * addon_services).
 *
 * These four tables previously had no write endpoint at all — the admin
 * panel called Supabase straight from the browser with the anon key, which
 * only worked because RLS was wide open. Every mutation now runs here:
 * SuperAdmin session required, zod-validated, audited.
 */

type CatalogTable = 'item_tiers' | 'locations' | 'addon_services';

interface CatalogConfig<C extends z.ZodType, U extends z.ZodType> {
  table: CatalogTable;
  /** Human-readable singular noun for messages, e.g. "item tier". */
  label: string;
  createSchema: C;
  updateSchema: U;
  /** Column ordering for the list response. */
  orderBy: string;
  /** Describe a row for the audit trail. */
  describe: (row: Record<string, unknown>) => string;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- the table name is a
   runtime value here, which the generated Database types cannot narrow. */

export function createCatalogHandlers<C extends z.ZodType, U extends z.ZodType>(cfg: CatalogConfig<C, U>) {
  /** Public read. Callers see active rows; admins can request all. */
  async function GET(req: Request) {
    try {
      const includeInactive = new URL(req.url).searchParams.get('all') === '1';

      // Only a SuperAdmin may see deactivated rows — they are hidden from
      // the public catalog for a reason.
      if (includeInactive) await requireSuperAdmin();

      const supabase = getDbClient();
      let query = (supabase.from(cfg.table) as any).select('*').order(cfg.orderBy);
      if (!includeInactive) query = query.eq('is_active', true);

      const { data, error } = await query;
      if (error) {
        console.error(`[${cfg.table}.GET] failed:`, error);
        throw serverError(`We could not load ${cfg.label}s.`);
      }
      return ok({ [cfg.table]: data ?? [] }, NO_STORE);
    } catch (err) {
      return fail(err, `${cfg.table}.GET`);
    }
  }

  async function POST(req: Request) {
    try {
      const actor = await requireSuperAdmin();
      const payload = await parseBody(req, cfg.createSchema);

      const supabase = createAdminClient();
      const { data, error } = await (supabase.from(cfg.table) as any).insert(payload).select('*').single();

      if (error) {
        // 23505 = unique_violation, almost always the `code` column.
        if (error.code === '23505') {
          throw conflict(`A ${cfg.label} with that code already exists.`);
        }
        console.error(`[${cfg.table}.POST] failed:`, error);
        throw serverError(`We could not create that ${cfg.label}.`);
      }

      await writeAudit({
        tableName: cfg.table,
        recordId: data.id,
        action: 'INSERT',
        summary: `Created ${cfg.label} ${cfg.describe(data)}`,
        actor,
        newValues: data,
      });

      invalidateSettingsCache();
      return ok({ [cfg.table.replace(/s$/, '')]: data }, NO_STORE);
    } catch (err) {
      return fail(err, `${cfg.table}.POST`);
    }
  }

  async function PATCH(req: Request) {
    try {
      const actor = await requireSuperAdmin();
      const payload = (await parseBody(req, cfg.updateSchema)) as Record<string, unknown> & { id: string };
      const { id, ...changes } = payload;

      if (Object.keys(changes).length === 0) throw badRequest('No changes supplied.');

      const supabase = createAdminClient();
      const { data: before } = await (supabase.from(cfg.table) as any).select('*').eq('id', id).maybeSingle();
      if (!before) throw notFound(`That ${cfg.label} no longer exists.`);

      const { data, error } = await (supabase.from(cfg.table) as any)
        .update(changes)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        if (error.code === '23505') throw conflict(`A ${cfg.label} with that code already exists.`);
        console.error(`[${cfg.table}.PATCH] failed:`, error);
        throw serverError(`We could not update that ${cfg.label}.`);
      }

      await writeAudit({
        tableName: cfg.table,
        recordId: id,
        action: 'UPDATE',
        summary: `Updated ${cfg.label} ${cfg.describe(data)}`,
        actor,
        oldValues: before,
        newValues: data,
      });

      invalidateSettingsCache();
      return ok({ [cfg.table.replace(/s$/, '')]: data }, NO_STORE);
    } catch (err) {
      return fail(err, `${cfg.table}.PATCH`);
    }
  }

  /**
   * DELETE deactivates rather than removing.
   *
   * Bookings carry foreign keys to tiers and locations, so a hard delete
   * either fails on the constraint or (worse, if someone adds a cascade)
   * destroys booking history. Deactivating hides the row from the public
   * catalog while keeping past bookings readable.
   */
  async function DELETE(req: Request) {
    try {
      const actor = await requireSuperAdmin();
      const id = new URL(req.url).searchParams.get('id');
      if (!id) throw badRequest('Missing id.');

      const supabase = createAdminClient();
      const { data: before } = await (supabase.from(cfg.table) as any).select('*').eq('id', id).maybeSingle();
      if (!before) throw notFound(`That ${cfg.label} no longer exists.`);

      const { error } = await (supabase.from(cfg.table) as any).update({ is_active: false }).eq('id', id);
      if (error) {
        console.error(`[${cfg.table}.DELETE] failed:`, error);
        throw serverError(`We could not archive that ${cfg.label}.`);
      }

      await writeAudit({
        tableName: cfg.table,
        recordId: id,
        action: 'DELETE',
        summary: `Archived ${cfg.label} ${cfg.describe(before)}`,
        actor,
        oldValues: before,
      });

      invalidateSettingsCache();
      return ok({ archived: id }, NO_STORE);
    } catch (err) {
      return fail(err, `${cfg.table}.DELETE`);
    }
  }

  return { GET, POST, PATCH, DELETE };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
