-- ================================================================
-- STOWAWAY — Migration 004
-- Security lockdown + dynamic app settings + operations support
--
-- WHAT THIS FIXES
-- Migration 003 granted the anon role blanket INSERT/UPDATE on
-- bookings, customers, booking_items and booking_addons
-- (`with check (true)` / `using (true)`). Because the anon key ships
-- to the browser, anyone could flip payment_status to 'paid', rewrite
-- another customer's PII, or edit pricing. Every server-side rule in
-- the app was bypassable by talking to PostgREST directly.
--
-- From 004 onward ALL writes go through Next.js route handlers using
-- the service-role key, which bypasses RLS by design. The anon role
-- keeps read access to the public catalog only.
-- ================================================================

-- ── App Settings (dynamic, admin-editable configuration) ──────
-- Single-row-per-key store so operators can retune the business
-- without a redeploy. `value` is jsonb so a setting can be a
-- number, bool, string or object.
create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  value_type  text not null default 'number'
                check (value_type in ('number', 'boolean', 'string', 'json')),
  label       text not null,
  description text,
  category    text not null default 'general',
  min_value   numeric,
  max_value   numeric,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

drop trigger if exists set_updated_at_app_settings on public.app_settings;
create trigger set_updated_at_app_settings
  before update on public.app_settings
  for each row execute function public.handle_updated_at();

-- Seed defaults. `on conflict do nothing` keeps operator overrides.
insert into public.app_settings (key, value, value_type, label, description, category, min_value, max_value) values
  ('insurance_enabled',        'true',  'boolean', 'Insurance Available',        'Master switch. When off, the insurance step is hidden from customers and never billed.', 'insurance', null, null),
  ('insurance_default_on',     'false', 'boolean', 'Insurance Pre-selected',     'Whether the insurance toggle starts enabled in the booking flow.',                      'insurance', null, null),
  ('insurance_label',          '"Damage & Loss Protection"', 'string', 'Insurance Display Name', 'Customer-facing name for the insurance product.',                      'insurance', null, null),
  ('week_threshold_days',      '7',     'number',  'Long-stay Threshold (days)', 'Bookings longer than this use each tier''s discounted long-stay day rate for ALL days.', 'pricing', 1, 365),
  ('airport_service_fee_usd',  '5.00',  'number',  'Airport Handling Fee (USD)', 'Flat fee applied when either leg of the booking is an airport location.',                'pricing', 0, 1000),
  ('min_booking_days',         '1',     'number',  'Minimum Billable Days',      'Floor applied to every booking duration.',                                              'pricing', 1, 365),
  ('max_booking_days',         '90',    'number',  'Maximum Booking Length',     'Bookings longer than this are rejected.',                                               'pricing', 1, 3650),
  ('max_items_per_booking',    '20',    'number',  'Max Items Per Booking',      'Total quantity across all tiers allowed in a single booking.',                          'limits',  1, 500),
  ('max_qty_per_tier',         '10',    'number',  'Max Quantity Per Tier',      'Maximum units of any single item tier in one booking.',                                 'limits',  1, 100),
  ('booking_lead_time_hours',  '0',     'number',  'Minimum Lead Time (hours)',  'How far in advance a drop-off must be booked. 0 allows immediate bookings.',            'limits',  0, 720),
  ('booking_horizon_days',     '365',   'number',  'Booking Horizon (days)',     'How far into the future a drop-off may be scheduled.',                                  'limits',  1, 3650),
  ('usd_to_lkr_rate',          '320',   'number',  'USD to LKR Fallback Rate',   'Used when the live exchange-rate feed is unavailable.',                                 'currency', 1, 100000),
  ('exchange_rate_live',       'true',  'boolean', 'Use Live Exchange Rate',     'Fetch the USD/LKR rate from the live feed. When off, the fallback rate above is used.',  'currency', null, null),
  ('support_phone',            '"+94770000000"', 'string', 'Support Phone',      'Shown to customers and used for the click-to-call action.',                             'support', null, null),
  ('support_whatsapp',         '"+94770000000"', 'string', 'Support WhatsApp',   'Number behind the WhatsApp support button.',                                            'support', null, null),
  ('turnstile_enabled',        'false', 'boolean', 'Cloudflare Turnstile',       'Require a Turnstile challenge on booking creation. Needs the Turnstile env vars set.',   'security', null, null),
  ('booking_rate_limit',       '10',    'number',  'Bookings Per IP / Hour',     'Rate limit on booking creation per client IP.',                                         'security', 1, 1000),
  ('ops_window_hours',         '48',    'number',  'Operations Window (hours)',  'How far ahead the staff dashboard looks for upcoming drop-offs and pick-ups.',           'operations', 1, 720)
on conflict (key) do nothing;

-- ── Bookings: columns the app was computing but never persisting ──
alter table public.bookings
  add column if not exists insurance_enabled boolean not null default false,
  add column if not exists duration_days     integer,
  add column if not exists cancelled_at      timestamptz,
  add column if not exists cancel_reason     text;

-- Idempotency: lets the booking endpoint dedupe double-submits.
alter table public.bookings
  add column if not exists idempotency_key text;

create unique index if not exists bookings_idempotency_key_uniq
  on public.bookings (idempotency_key)
  where idempotency_key is not null;

-- ── Indexes for the operations dashboard & customer lookup ────
create index if not exists bookings_storage_start_idx  on public.bookings (storage_start_date);
create index if not exists bookings_storage_end_idx    on public.bookings (storage_end_date);
create index if not exists bookings_status_idx         on public.bookings (booking_status);
create index if not exists bookings_dropoff_loc_idx    on public.bookings (dropoff_location_id);
create index if not exists bookings_pickup_loc_idx     on public.bookings (pickup_location_id);
create index if not exists bookings_created_at_idx     on public.bookings (created_at desc);
create index if not exists booking_items_booking_idx   on public.booking_items (booking_id);
create index if not exists booking_addons_booking_idx  on public.booking_addons (booking_id);
create index if not exists customers_phone_idx         on public.customers (phone);
create index if not exists audit_log_created_at_idx    on public.audit_log (created_at desc);
create index if not exists audit_log_table_idx         on public.audit_log (table_name);

-- ── Audit log: record who did it, in a readable form ──────────
alter table public.audit_log
  add column if not exists actor_email text,
  add column if not exists summary     text;

-- ================================================================
-- RLS LOCKDOWN
-- ================================================================
alter table public.app_settings enable row level security;

-- Drop every permissive write policy introduced by 003.
drop policy if exists "Public can insert customers"      on public.customers;
drop policy if exists "Public can update customers"      on public.customers;
drop policy if exists "Public can insert bookings"       on public.bookings;
drop policy if exists "Public can update bookings"       on public.bookings;
drop policy if exists "Public can insert booking_items"  on public.booking_items;
drop policy if exists "Public can insert booking_addons" on public.booking_addons;

-- The old staff policy was `using (auth.uid() = user_id or true)`,
-- i.e. every authenticated user could read the whole staff roster.
drop policy if exists "Staff can read their own profile" on public.staff;
create policy "Staff read own profile" on public.staff
  for select using (auth.uid() = user_id);

-- ── Public (anon) read access: catalog tables only ────────────
-- These drive the public booking flow and contain no personal data.
drop policy if exists "Public can read locations"      on public.locations;
create policy "Public can read active locations" on public.locations
  for select using (is_active = true);

drop policy if exists "Public can read time_slots"     on public.time_slots;
create policy "Public can read active time_slots" on public.time_slots
  for select using (is_active = true);

drop policy if exists "Public can read item_tiers"     on public.item_tiers;
create policy "Public can read active item_tiers" on public.item_tiers
  for select using (is_active = true);

drop policy if exists "Public can read addon_services" on public.addon_services;
create policy "Public can read active addon_services" on public.addon_services
  for select using (is_active = true);

drop policy if exists "Public can read app_settings"   on public.app_settings;
create policy "Public can read app_settings" on public.app_settings
  for select using (true);

-- No policies are defined for customers, bookings, booking_items,
-- booking_addons or audit_log. With RLS enabled and no policy, anon
-- and authenticated are denied by default. The service-role key used
-- by the server routes bypasses RLS, which is the only write path.

-- Belt and braces: revoke the table grants PostgREST relies on so a
-- future stray policy cannot silently re-open write access.
revoke insert, update, delete on public.locations       from anon, authenticated;
revoke insert, update, delete on public.time_slots      from anon, authenticated;
revoke insert, update, delete on public.item_tiers      from anon, authenticated;
revoke insert, update, delete on public.addon_services  from anon, authenticated;
revoke insert, update, delete on public.app_settings    from anon, authenticated;
revoke insert, update, delete on public.customers       from anon, authenticated;
revoke insert, update, delete on public.bookings        from anon, authenticated;
revoke insert, update, delete on public.booking_items   from anon, authenticated;
revoke insert, update, delete on public.booking_addons  from anon, authenticated;
revoke insert, update, delete on public.staff           from anon, authenticated;
revoke insert, update, delete on public.audit_log       from anon, authenticated;

revoke select on public.customers      from anon, authenticated;
revoke select on public.bookings       from anon, authenticated;
revoke select on public.booking_items  from anon, authenticated;
revoke select on public.booking_addons from anon, authenticated;
revoke select on public.audit_log      from anon, authenticated;
