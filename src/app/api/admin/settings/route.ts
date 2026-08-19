import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/auth/guard';
import { fail, ok, NO_STORE } from '@/lib/api/http';
import { getDefaultSettingRows } from '@/lib/settings';

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

    if (!isServiceRoleConfigured()) {
      return ok({ settings: getDefaultSettingRows(), isFallback: true }, NO_STORE);
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('category')
      .order('key');

    if (error || !data || data.length === 0) {
      console.warn('[admin.settings.GET] DB settings unavailable, using defaults:', error);
      return ok({ settings: getDefaultSettingRows(), isFallback: true }, NO_STORE);
    }

    return ok({ settings: data }, NO_STORE);
  } catch (err) {
    return fail(err, 'admin.settings.GET');
  }
}

