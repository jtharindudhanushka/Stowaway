-- ================================================================
-- STOWAWAY — Database Schema
-- Migration: 001_initial_schema
-- ================================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── Locations ─────────────────────────────────────────────────
create table if not exists public.locations (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  code                  text not null unique,
  dropoff_surcharge_usd numeric(10,2) not null default 0,
  pickup_surcharge_usd  numeric(10,2) not null default 0,
  requires_stripe       boolean not null default false,
  allows_cash           boolean not null default true,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── Time Slots ────────────────────────────────────────────────
create table if not exists public.time_slots (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  start_time  text not null,
  end_time    text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── Item Tiers ────────────────────────────────────────────────
create table if not exists public.item_tiers (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  name              text not null,
  description       text not null,
  supported_items   text not null,
  weight_spec       text,
  icon_emoji        text not null default '🧳',
  rate_daily_usd    numeric(10,2) not null,
  rate_weekly_usd   numeric(10,2) not null,
  rate_monthly_usd  numeric(10,2) not null,
  is_active         boolean not null default true,
  display_order     integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── Add-On Services ───────────────────────────────────────────
create table if not exists public.addon_services (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text not null,
  fee_usd     numeric(10,2) not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Customers ─────────────────────────────────────────────────
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  phone           text not null unique,
  full_name       text,
  email           text,
  passport_number text,
  otp_code        text,
  otp_expires_at  timestamptz,
  verified_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- ── Bookings ──────────────────────────────────────────────────
create table if not exists public.bookings (
  id                    uuid primary key default gen_random_uuid(),
  customer_id           uuid not null references public.customers(id) on delete cascade,
  dropoff_location_id   uuid not null references public.locations(id),
  pickup_location_id    uuid not null references public.locations(id),
  duration_type         text not null check (duration_type in ('daily','weekly','monthly')),
  duration_value        integer not null check (duration_value > 0),
  dropoff_time          text,
  pickup_time           text,
  storage_start_date    date not null,
  storage_end_date      date not null,
  base_total_usd        numeric(10,2) not null default 0,
  dropoff_surcharge_usd numeric(10,2) not null default 0,
  pickup_surcharge_usd  numeric(10,2) not null default 0,
  addon_total_usd       numeric(10,2) not null default 0,
  grand_total_usd       numeric(10,2) not null default 0,
  payment_method        text not null check (payment_method in ('cash','stripe_simulated')),
  payment_status        text not null default 'pending' check (payment_status in ('pending','paid','failed')),
  booking_status        text not null default 'confirmed' check (booking_status in ('confirmed','in_transit','deposited','picked_up','cancelled')),
  qr_code_token         text not null default gen_random_uuid()::text,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── Booking Items ─────────────────────────────────────────────
create table if not exists public.booking_items (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null references public.bookings(id) on delete cascade,
  tier_id        uuid not null references public.item_tiers(id),
  quantity       integer not null check (quantity > 0),
  unit_rate_usd  numeric(10,2) not null,
  line_total_usd numeric(10,2) not null
);

-- ── Booking Add-Ons ───────────────────────────────────────────
create table if not exists public.booking_addons (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  addon_id   uuid not null references public.addon_services(id),
  fee_usd    numeric(10,2) not null
);

-- ── Staff ─────────────────────────────────────────────────────
create table if not exists public.staff (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  role       text not null default 'staff' check (role in ('staff','superadmin')),
  full_name  text not null,
  created_at timestamptz not null default now()
);

-- ── Audit Log ─────────────────────────────────────────────────
create table if not exists public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id  text not null,
  action     text not null check (action in ('INSERT','UPDATE','DELETE')),
  actor_id   uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

-- ── Updated_at trigger ────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_locations
  before update on public.locations
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_item_tiers
  before update on public.item_tiers
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_addon_services
  before update on public.addon_services
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_bookings
  before update on public.bookings
  for each row execute function public.handle_updated_at();

-- ── Row Level Security ────────────────────────────────────────
alter table public.locations       enable row level security;
alter table public.time_slots      enable row level security;
alter table public.item_tiers      enable row level security;
alter table public.addon_services  enable row level security;
alter table public.customers       enable row level security;
alter table public.bookings        enable row level security;
alter table public.booking_items   enable row level security;
alter table public.booking_addons  enable row level security;
alter table public.staff           enable row level security;
alter table public.audit_log       enable row level security;

-- Public read policies
create policy "Public can read locations"   on public.locations for select using (true);
create policy "Public can read time_slots"  on public.time_slots for select using (true);
create policy "Public can read item_tiers"  on public.item_tiers for select using (true);
create policy "Public can read addon_services" on public.addon_services for select using (true);
