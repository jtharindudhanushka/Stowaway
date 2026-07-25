-- ================================================================
-- STOWAWAY — Safe Idempotent Production Seed Data
-- Database: Supabase PostgreSQL
-- ================================================================

-- ── Locations ─────────────────────────────────────────────────
insert into public.locations
  (name, code, dropoff_surcharge_usd, pickup_surcharge_usd, requires_stripe, allows_cash)
values
  ('CMB Airport Storage Hub', 'LOC_001', 10.00, 10.00, true, false),
  ('Hotel Thilon Drop Point', 'LOC_002', 0.00, 0.00, false, true),
  ('Colombo Fort Railway Terminal', 'LOC_003', 2.00, 2.00, false, true)
on conflict (code) do nothing;

-- ── Time Slots (Safe insert using WHERE NOT EXISTS) ───────────
insert into public.time_slots (label, start_time, end_time, is_active)
select '08:00 AM - 10:00 AM', '08:00', '10:00', true
where not exists (select 1 from public.time_slots where label = '08:00 AM - 10:00 AM');

insert into public.time_slots (label, start_time, end_time, is_active)
select '10:00 AM - 12:00 PM', '10:00', '12:00', true
where not exists (select 1 from public.time_slots where label = '10:00 AM - 12:00 PM');

insert into public.time_slots (label, start_time, end_time, is_active)
select '12:00 PM - 02:00 PM', '12:00', '14:00', true
where not exists (select 1 from public.time_slots where label = '12:00 PM - 02:00 PM');

insert into public.time_slots (label, start_time, end_time, is_active)
select '02:00 PM - 04:00 PM', '14:00', '16:00', true
where not exists (select 1 from public.time_slots where label = '02:00 PM - 04:00 PM');

insert into public.time_slots (label, start_time, end_time, is_active)
select '04:00 PM - 06:00 PM', '16:00', '18:00', true
where not exists (select 1 from public.time_slots where label = '04:00 PM - 06:00 PM');

insert into public.time_slots (label, start_time, end_time, is_active)
select '06:00 PM - 08:00 PM', '18:00', '20:00', true
where not exists (select 1 from public.time_slots where label = '06:00 PM - 08:00 PM');

insert into public.time_slots (label, start_time, end_time, is_active)
select '08:00 PM - 10:00 PM', '20:00', '22:00', true
where not exists (select 1 from public.time_slots where label = '08:00 PM - 10:00 PM');

-- ── Item Tiers ────────────────────────────────────────────────
insert into public.item_tiers
  (code, name, description, supported_items, weight_spec, icon_emoji,
   rate_daily_usd, rate_weekly_usd, rate_monthly_usd, display_order)
values
  ('ITEM_001', 'Small Bag / Documents',
   'Laptops, handbags, document files, small totes',
   'Laptop, handbag, document files, small totes',
   'Standard personal item', '💼',
   1.00, 5.00, 25.00, 1),

  ('ITEM_002', 'Carry-On Luggage',
   'Standard carry-on suitcases, backpacks, trolleys',
   'Carry-on suitcases, backpacks, trolleys',
   'Max weight: 15 kg', '🧳',
   2.00, 10.00, 45.00, 2),

  ('ITEM_003', 'Large Suitcase',
   'Extra-large luggage, heavy check-in suitcases',
   'Extra-large luggage, heavy check-in suitcases',
   'Max weight: 40 kg', '🗃️',
   3.50, 18.00, 75.00, 3),

  ('ITEM_004', 'Odd-Sized Items',
   'Foldable bicycles, golf bags, baby car seats, surfboards',
   'Foldable bicycles, golf bags, baby car seats, surfboards',
   'Non-standard dimensions', '🚲',
   5.00, 25.00, 100.00, 4),

  ('ITEM_005', 'Tea Chest Box',
   'Standard tea chest size boxes, storage crates',
   'Standard tea chest size boxes, storage crates',
   'Heavy/Bulky volume', '📦',
   4.00, 20.00, 85.00, 5)
on conflict (code) do nothing;

-- ── Add-On Services ───────────────────────────────────────────
insert into public.addon_services
  (code, name, description, fee_usd)
values
  ('ADDON_001', 'Airport Delivery Service',
   'Direct luggage collection or delivery at Colombo Airport terminal',
   5.00)
on conflict (code) do nothing;

-- ── Seed Customers (Safe insert by unique phone) ───────────────
insert into public.customers
  (phone, full_name, email, passport_number)
values
  ('+94 77 555 1234', 'Pasan Dhanushka', 'pasan@stowaway.lk', 'N9876543'),
  ('+1 415 555 0199', 'Alex Rivera', 'alex.rivera@gmail.com', 'A4829105'),
  ('+81 90 1234 5678', 'Sophia Tanaka', 'sophia.tanaka@japan.jp', 'TK901234')
on conflict (phone) do nothing;

-- ── Seed Staff & SuperAdmin Accounts ──────────────────────────
-- Enable pgcrypto for proper bcrypt password hashing
create extension if not exists pgcrypto;

insert into auth.users
  (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
values
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@stowaway.lk',
    crypt('StowawayAdmin2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Operations Director"}',
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'staff@stowaway.lk',
    crypt('StowawayStaff2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"CMB Airport Operational Staff"}',
    now(), now(), 'authenticated', 'authenticated'
  )
on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
  updated_at = now();

insert into public.staff
  (user_id, role, full_name)
select
  u.id, 'superadmin', 'Operations Director (SuperAdmin)'
from auth.users u where u.email = 'admin@stowaway.lk'
on conflict (user_id) do nothing;

-- ── Seed auth.identities (REQUIRED for signInWithPassword) ─────
-- Without this, Supabase auth returns 500 even with correct password.
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(), now(), now()
from auth.users u
where u.email in ('admin@stowaway.lk', 'staff@stowaway.lk')
  and not exists (
    select 1 from auth.identities i
    where i.user_id = u.id and i.provider = 'email'
  );

insert into public.staff
  (user_id, role, full_name)
select
  u.id, 'staff', 'CMB Airport Operational Staff'
from auth.users u where u.email = 'staff@stowaway.lk'
on conflict (user_id) do nothing;

-- ── Seed Operational Bookings (Dynamic FK Resolution) ────────
insert into public.bookings
  (customer_id, dropoff_location_id, pickup_location_id, duration_type, duration_value, storage_start_date, storage_end_date, grand_total_usd, payment_method, payment_status, booking_status, notes)
select
  c.id, l1.id, l2.id, 'daily', 2, '2026-07-27'::date, '2026-07-29'::date, 33.00, 'stripe_simulated', 'paid', 'confirmed', 'Flight UL 504 arrival at 10 AM'
from
  public.customers c,
  public.locations l1,
  public.locations l2
where
  c.phone = '+94 77 555 1234'
  and l1.code = 'LOC_001'
  and l2.code = 'LOC_002';

insert into public.bookings
  (customer_id, dropoff_location_id, pickup_location_id, duration_type, duration_value, storage_start_date, storage_end_date, grand_total_usd, payment_method, payment_status, booking_status, notes)
select
  c.id, l1.id, l2.id, 'daily', 3, '2026-07-26'::date, '2026-07-29'::date, 42.50, 'cash', 'pending', 'deposited', 'Surfboard & carry-on bag storage'
from
  public.customers c,
  public.locations l1,
  public.locations l2
where
  c.phone = '+1 415 555 0199'
  and l1.code = 'LOC_002'
  and l2.code = 'LOC_001';
