-- ================================================================
-- STOWAWAY — Additive Migration 002
-- Apply this to existing Supabase projects that already ran 001.
-- Safe: all statements use IF NOT EXISTS / IF EXISTS guards.
-- ================================================================

-- ── locations: add is_airport flag ───────────────────────────
alter table public.locations
  add column if not exists is_airport boolean not null default false;

-- Mark CMB Airport
update public.locations set is_airport = true where code = 'LOC_001';

-- ── time_slots: add slot_type & scheduling columns ───────────
alter table public.time_slots
  add column if not exists slot_type   text not null default 'window'
    check (slot_type in ('window', 'hourly')),
  add column if not exists day_of_week text not null default 'all',
  add column if not exists specific_date date;

-- ── item_tiers: add per-item insurance fee & drop rate_monthly_usd constraint ────
alter table public.item_tiers
  add column if not exists insurance_fee_usd numeric(10,2) not null default 0;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'item_tiers'
      and column_name = 'rate_monthly_usd'
  ) then
    alter table public.item_tiers alter column rate_monthly_usd drop not null;
  end if;
end $$;

-- Seed insurance prices (2.40 for all existing tiers)
update public.item_tiers set insurance_fee_usd = 2.40 where insurance_fee_usd = 0;

-- ── item_tiers: update rates to match notebook ───────────────
update public.item_tiers set rate_daily_usd = 3.00, rate_weekly_usd = 2.40 where code = 'ITEM_001';
update public.item_tiers set rate_daily_usd = 4.00, rate_weekly_usd = 3.20 where code = 'ITEM_002';
update public.item_tiers set rate_daily_usd = 5.00, rate_weekly_usd = 4.00 where code = 'ITEM_003';
update public.item_tiers set rate_daily_usd = 7.00, rate_weekly_usd = 5.50 where code = 'ITEM_004';
update public.item_tiers set rate_daily_usd = 4.00, rate_weekly_usd = 3.20 where code = 'ITEM_005';

-- ── bookings: rename/add pricing columns ─────────────────────
-- Add new explicit columns (replaces opaque base_total_usd + addon_total_usd)
alter table public.bookings
  add column if not exists duration_unit       text not null default 'days'
    check (duration_unit in ('hours', 'days')),
  add column if not exists item_total_usd      numeric(10,2) not null default 0,
  add column if not exists airport_service_usd numeric(10,2) not null default 0,
  add column if not exists insurance_total_usd numeric(10,2) not null default 0;

-- Migrate existing data: item_total_usd from base_total_usd if it exists
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bookings'
      and column_name = 'base_total_usd'
  ) then
    update public.bookings set item_total_usd = base_total_usd where item_total_usd = 0;
    update public.bookings set airport_service_usd = addon_total_usd where airport_service_usd = 0;
  end if;
end;
$$;
