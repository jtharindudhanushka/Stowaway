-- ================================================================
-- STOWAWAY — Admin & Staff Full Write Permissions SQL Fix
-- Run this in Supabase SQL Editor to enable Admin edits to
-- item_tiers, locations, addon_services, time_slots, and bookings.
-- ================================================================

-- Drop existing policies if they exist to prevent conflicts
drop policy if exists "Authenticated staff can manage locations" on public.locations;
drop policy if exists "Authenticated staff can manage time_slots" on public.time_slots;
drop policy if exists "Authenticated staff can manage item_tiers" on public.item_tiers;
drop policy if exists "Authenticated staff can manage addon_services" on public.addon_services;
drop policy if exists "Authenticated staff can manage bookings" on public.bookings;
drop policy if exists "Authenticated staff can manage audit_log" on public.audit_log;
drop policy if exists "Public can insert bookings" on public.bookings;
drop policy if exists "Public can insert customers" on public.customers;
drop policy if exists "Public can read bookings" on public.bookings;

-- Grant RLS write policies for authenticated staff/admin
create policy "Authenticated staff can manage locations" on public.locations
  for all using (auth.role() = 'authenticated');

create policy "Authenticated staff can manage time_slots" on public.time_slots
  for all using (auth.role() = 'authenticated');

create policy "Authenticated staff can manage item_tiers" on public.item_tiers
  for all using (auth.role() = 'authenticated');

create policy "Authenticated staff can manage addon_services" on public.addon_services
  for all using (auth.role() = 'authenticated');

create policy "Authenticated staff can manage bookings" on public.bookings
  for all using (auth.role() = 'authenticated');

create policy "Authenticated staff can manage audit_log" on public.audit_log
  for all using (auth.role() = 'authenticated');

-- Public customer booking policies
create policy "Public can insert bookings" on public.bookings
  for insert with check (true);

create policy "Public can insert customers" on public.customers
  for insert with check (true);

create policy "Public can read bookings" on public.bookings
  for select using (true);
