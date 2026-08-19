import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/auth/guard';
import { writeAudit } from '@/lib/audit';
import { parseBody, timeSlotsPayloadSchema } from '@/lib/validation/schemas';
import { fail, ok, serverError, NO_STORE } from '@/lib/api/http';
import type { TimeSlotRow } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

/**
 * Operational time slots.
 *
 * The previous POST here was unauthenticated and unvalidated — anyone could
 * rewrite the entire operating schedule, and the handler also kept a
 * module-level MEMORY_TIME_SLOTS array that diverged from the DB per
 * instance. Both are gone: SuperAdmin only, zod-validated, DB is the only
 * store.
 */

/**
 * GET /api/time-slots[?date=YYYY-MM-DD]
 *
 * Resolution order for a given date:
 *   1. slots with a matching `specific_date` (a one-off override),
 *   2. otherwise recurring slots for that weekday ('all' or the day index).
 */
export async function GET(req: Request) {
  try {
    const dateStr = new URL(req.url).searchParams.get('date');

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('is_active', true)
      .order('start_time');

    if (error) {
      console.error('[time-slots.GET] failed:', error);
      throw serverError('We could not load available times. Please try again.');
    }

    const slots: TimeSlotRow[] = data ?? [];

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return ok({ timeSlots: slots }, NO_STORE);
    }

    const overrides = slots.filter((s) => s.specific_date === dateStr);
    if (overrides.length > 0) {
      return ok({ timeSlots: overrides, isOverride: true, date: dateStr }, NO_STORE);
    }

    // Parse as UTC so the weekday does not shift with server timezone.
    const dayOfWeek = new Date(`${dateStr}T00:00:00Z`).getUTCDay().toString();
    const recurring = slots.filter(
      (s) => !s.specific_date && (s.day_of_week === 'all' || s.day_of_week === dayOfWeek),
    );

    return ok({ timeSlots: recurring, isOverride: false, date: dateStr }, NO_STORE);
  } catch (err) {
    return fail(err, 'time-slots.GET');
  }
}

/**
 * PUT /api/time-slots — replace the schedule. SuperAdmin only.
 *
 * Sent as a full set rather than per-row edits because the admin UI edits
 * the schedule as one document. Rows absent from the payload are
 * deactivated, not deleted, so a slot referenced by history stays readable.
 */
export async function PUT(req: Request) {
  try {
    const actor = await requireSuperAdmin();
    const { timeSlots } = await parseBody(req, timeSlotsPayloadSchema);

    const supabase = createAdminClient();
    const { data: existing, error: readErr } = await supabase.from('time_slots').select('id');
    if (readErr) {
      console.error('[time-slots.PUT] read failed:', readErr);
      throw serverError('We could not load the current schedule.');
    }

    const seededIds = new Set((existing ?? []).map((r) => r.id));
    const keptIds = new Set<string>();

    for (const slot of timeSlots) {
      // Client-side placeholder ids ("slot-1", "ts-3") are not real rows.
      const isRealId = slot.id && seededIds.has(slot.id);
      const row = {
        label: slot.label,
        start_time: slot.start_time,
        end_time: slot.end_time,
        slot_type: slot.slot_type,
        day_of_week: slot.day_of_week,
        specific_date: slot.specific_date ?? null,
        is_active: slot.is_active,
      };

      if (isRealId) {
        const { error } = await supabase.from('time_slots').update(row).eq('id', slot.id!);
        if (error) {
          console.error('[time-slots.PUT] update failed:', slot.id, error);
          throw serverError(`We could not save the "${slot.label}" slot.`);
        }
        keptIds.add(slot.id!);
      } else {
        const { data: inserted, error } = await supabase.from('time_slots').insert(row).select('id').single();
        if (error) {
          console.error('[time-slots.PUT] insert failed:', slot.label, error);
          throw serverError(`We could not save the "${slot.label}" slot.`);
        }
        if (inserted?.id) keptIds.add(inserted.id);
      }
    }

    const removed = [...seededIds].filter((id) => !keptIds.has(id));
    if (removed.length > 0) {
      const { error } = await supabase.from('time_slots').update({ is_active: false }).in('id', removed);
      if (error) console.error('[time-slots.PUT] deactivate failed:', error);
    }

    await writeAudit({
      tableName: 'time_slots',
      recordId: 'schedule',
      action: 'UPDATE',
      summary: `Updated operating schedule — ${keptIds.size} active slot(s), ${removed.length} retired`,
      actor,
    });

    const { data: fresh } = await supabase
      .from('time_slots')
      .select('*')
      .eq('is_active', true)
      .order('start_time');

    return ok({ timeSlots: fresh ?? [] }, NO_STORE);
  } catch (err) {
    return fail(err, 'time-slots.PUT');
  }
}
