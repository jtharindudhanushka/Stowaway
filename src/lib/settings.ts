import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin';

/**
 * Dynamic app configuration — server side.
 *
 * Everything an operator might want to retune (insurance on/off, the
 * long-stay threshold, airport fee, booking limits, support numbers) lives
 * in `public.app_settings` rather than in code, so the admin panel can
 * change it without a redeploy.
 *
 * DEFAULTS below are the contract: they are what the app uses when the DB
 * is unreachable or a key has not been seeded. Keep them in sync with the
 * seed block in migration 004.
 */

export interface AppSettings {
  insurance_enabled: boolean;
  insurance_default_on: boolean;
  insurance_label: string;
  week_threshold_days: number;
  airport_service_fee_usd: number;
  min_booking_days: number;
  max_booking_days: number;
  max_items_per_booking: number;
  max_qty_per_tier: number;
  booking_lead_time_hours: number;
  booking_horizon_days: number;
  usd_to_lkr_rate: number;
  exchange_rate_live: boolean;
  support_phone: string;
  support_whatsapp: string;
  turnstile_enabled: boolean;
  booking_rate_limit: number;
  ops_window_hours: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  insurance_enabled: true,
  insurance_default_on: false,
  insurance_label: 'Damage & Loss Protection',
  week_threshold_days: 7,
  airport_service_fee_usd: 5.0,
  min_booking_days: 1,
  max_booking_days: 90,
  max_items_per_booking: 20,
  max_qty_per_tier: 10,
  booking_lead_time_hours: 0,
  booking_horizon_days: 365,
  usd_to_lkr_rate: 320,
  exchange_rate_live: true,
  support_phone: '+94770000000',
  support_whatsapp: '+94770000000',
  turnstile_enabled: false,
  booking_rate_limit: 10,
  ops_window_hours: 48,
};

export type SettingKey = keyof AppSettings;

/**
 * Short-lived cache. Settings change rarely but are read on every booking
 * request; 30s keeps admin edits feeling immediate without hammering the DB.
 */
const CACHE_TTL_MS = 30_000;
let cache: { value: AppSettings; expiresAt: number } | null = null;

function coerce<K extends SettingKey>(key: K, raw: unknown): AppSettings[K] {
  const fallback = DEFAULT_SETTINGS[key];

  if (typeof fallback === 'boolean') {
    if (typeof raw === 'boolean') return raw as AppSettings[K];
    if (raw === 'true') return true as AppSettings[K];
    if (raw === 'false') return false as AppSettings[K];
    return fallback;
  }

  if (typeof fallback === 'number') {
    const n = typeof raw === 'number' ? raw : Number(raw);
    return (Number.isFinite(n) ? n : fallback) as AppSettings[K];
  }

  // string
  if (typeof raw === 'string' && raw.trim()) return raw as AppSettings[K];
  return fallback;
}

/** Load all settings, merged over defaults. Never throws. */
export async function getSettings(force = false): Promise<AppSettings> {
  const now = Date.now();
  if (!force && cache && cache.expiresAt > now) return cache.value;

  if (!isServiceRoleConfigured()) return DEFAULT_SETTINGS;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('app_settings').select('key, value');
    if (error) throw error;

    const merged = { ...DEFAULT_SETTINGS };
    for (const row of data ?? []) {
      const key = row.key as SettingKey;
      if (key in merged) {
        // @ts-expect-error — key is narrowed by the `in` check above
        merged[key] = coerce(key, row.value);
      }
    }

    cache = { value: merged, expiresAt: now + CACHE_TTL_MS };
    return merged;
  } catch (e) {
    console.error('[settings] falling back to defaults:', e);
    return cache?.value ?? DEFAULT_SETTINGS;
  }
}

/** Invalidate the cache after an admin write so the change lands at once. */
export function invalidateSettingsCache() {
  cache = null;
}

/**
 * Settings the public booking flow is allowed to see. Security-relevant
 * keys (rate limits, turnstile state beyond the site key) stay server-side.
 */
export type PublicSettings = Pick<
  AppSettings,
  | 'insurance_enabled'
  | 'insurance_default_on'
  | 'insurance_label'
  | 'week_threshold_days'
  | 'airport_service_fee_usd'
  | 'min_booking_days'
  | 'max_booking_days'
  | 'max_items_per_booking'
  | 'max_qty_per_tier'
  | 'booking_lead_time_hours'
  | 'booking_horizon_days'
  | 'usd_to_lkr_rate'
  | 'support_phone'
  | 'support_whatsapp'
>;

export function toPublicSettings(s: AppSettings): PublicSettings {
  return {
    insurance_enabled: s.insurance_enabled,
    insurance_default_on: s.insurance_default_on,
    insurance_label: s.insurance_label,
    week_threshold_days: s.week_threshold_days,
    airport_service_fee_usd: s.airport_service_fee_usd,
    min_booking_days: s.min_booking_days,
    max_booking_days: s.max_booking_days,
    max_items_per_booking: s.max_items_per_booking,
    max_qty_per_tier: s.max_qty_per_tier,
    booking_lead_time_hours: s.booking_lead_time_hours,
    booking_horizon_days: s.booking_horizon_days,
    usd_to_lkr_rate: s.usd_to_lkr_rate,
    support_phone: s.support_phone,
    support_whatsapp: s.support_whatsapp,
  };
}
