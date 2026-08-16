-- ================================================================
-- STOWAWAY — Additive Migration 003 (Public Inserts)
-- Apply this to existing Supabase projects that already ran 002.
-- Fixes issue where bookings, customers, and booking_items cannot be inserted by anon role.
-- ================================================================

-- Customers
drop policy if exists "Public can insert customers" on public.customers;
create policy "Public can insert customers" on public.customers for insert with check (true);

drop policy if exists "Public can update customers" on public.customers;
create policy "Public can update customers" on public.customers for update using (true);

-- Bookings
drop policy if exists "Public can insert bookings" on public.bookings;
create policy "Public can insert bookings" on public.bookings for insert with check (true);

drop policy if exists "Public can update bookings" on public.bookings;
create policy "Public can update bookings" on public.bookings for update using (true);

-- Booking Items
drop policy if exists "Public can insert booking_items" on public.booking_items;
create policy "Public can insert booking_items" on public.booking_items for insert with check (true);

-- Booking Addons
drop policy if exists "Public can insert booking_addons" on public.booking_addons;
create policy "Public can insert booking_addons" on public.booking_addons for insert with check (true);
