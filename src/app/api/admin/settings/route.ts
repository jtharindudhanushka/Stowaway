import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/auth/guard';
import { fail, ok, serverError, NO_STORE } from '@/lib/api/http';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/settings — SuperAdmin only.
 *
 * Returns the full setting rows (label, description, category, type and
 * min/max bounds) so the admin panel can render an appropriate control per
 * setting and validate before submitting. Writes go to PATCH /api/settings.
 */
export async function GET() {
  try {
    await requireSuperAdmin();

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('category')
      .order('key');

    if (error) {
      console.error('[admin.settings.GET] failed:', error);
      throw serverError('We could not load settings.');
    }

    return ok({ settings: data ?? [] }, NO_STORE);
  } catch (err) {
    return fail(err, 'admin.settings.GET');
  }
}
