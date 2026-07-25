-- ================================================================
-- STOWAWAY — Complete Production Seed Data
-- Database: Supabase PostgreSQL
-- ================================================================

-- ── Locations ─────────────────────────────────────────────────
insert into public.locations
  (id, name, code, dropoff_surcharge_usd, pickup_surcharge_usd, requires_stripe, allows_cash)
values
  ('loc-001', 'CMB Airport Storage Hub', 'LOC_001', 10.00, 10.00, true, false),
  ('loc-002', 'Hotel Thilon Drop Point', 'LOC_002', 0.00, 0.00, false, true),
  ('loc-003', 'Colombo Fort Railway Terminal', 'LOC_003', 2.00, 2.00, false, true)
on conflict (code) do nothing;

-- ── Item Tiers ────────────────────────────────────────────────
insert into public.item_tiers
  (id, code, name, description, supported_items, weight_spec, icon_emoji,
   rate_daily_usd, rate_weekly_usd, rate_monthly_usd, display_order)
values
  ('item-001', 'ITEM_001', 'Small Bag / Documents',
   'Laptops, handbags, document files, small totes',
   'Laptop, handbag, document files, small totes',
   'Standard personal item', '💼',
   1.00, 5.00, 25.00, 1),

  ('item-002', 'ITEM_002', 'Carry-On Luggage',
   'Standard carry-on suitcases, backpacks, trolleys',
   'Carry-on suitcases, backpacks, trolleys',
   'Max weight: 15 kg', '🧳',
   2.00, 10.00, 45.00, 2),

  ('item-003', 'ITEM_003', 'Large Suitcase',
   'Extra-large luggage, heavy check-in suitcases',
   'Extra-large luggage, heavy check-in suitcases',
   'Max weight: 40 kg', '🗃️',
   3.50, 18.00, 75.00, 3),

  ('item-004', 'ITEM_004', 'Odd-Sized Items',
   'Foldable bicycles, golf bags, baby car seats, surfboards',
   'Foldable bicycles, golf bags, baby car seats, surfboards',
   'Non-standard dimensions', '🚲',
   5.00, 25.00, 100.00, 4),

  ('item-005', 'ITEM_005', 'Tea Chest Box',
   'Standard tea chest size boxes, storage crates',
   'Standard tea chest size boxes, storage crates',
   'Heavy/Bulky volume', '📦',
   4.00, 20.00, 85.00, 5)
on conflict (code) do nothing;

-- ── Add-On Services ───────────────────────────────────────────
insert into public.addon_services
  (id, code, name, description, fee_usd)
values
  ('addon-001', 'ADDON_001', 'Airport Delivery Service',
   'Direct luggage collection or delivery at Colombo Airport terminal',
   5.00)
on conflict (code) do nothing;

-- ── Seed Customers ─────────────────────────────────────────────
insert into public.customers
  (id, phone, full_name, email, passport_number)
values
  ('cust-001', '+94 77 555 1234', 'Pasan Dhanushka', 'pasan@stowaway.lk', 'N9876543'),
  ('cust-002', '+1 415 555 0199', 'Alex Rivera', 'alex.rivera@gmail.com', 'A4829105'),
  ('cust-003', '+81 90 1234 5678', 'Sophia Tanaka', 'sophia.tanaka@japan.jp', 'TK901234')
on conflict (id) do nothing;

-- ── Seed Operational Bookings ──────────────────────────────────
insert into public.bookings
  (id, customer_id, dropoff_location_id, pickup_location_id, duration_type, duration_value, storage_start_date, storage_end_date, grand_total_usd, payment_method, notes, status)
values
  ('bk-8921a4', 'cust-001', 'loc-001', 'loc-002', 'daily', 2, '2026-07-27', '2026-07-29', 33.00, 'card', 'Flight UL 504 arrival at 10 AM', 'confirmed'),
  ('bk-4410e2', 'cust-002', 'loc-002', 'loc-001', 'daily', 3, '2026-07-26', '2026-07-29', 42.50, 'card', 'Surfboard & carry-on bag storage', 'deposited')
on conflict (id) do nothing;
