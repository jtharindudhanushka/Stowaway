-- ================================================================
-- STOWAWAY — Seed Data
-- Run after 001_schema.sql
-- ================================================================

-- ── Locations ─────────────────────────────────────────────────
insert into public.locations
  (name, code, dropoff_surcharge_usd, pickup_surcharge_usd, requires_stripe, allows_cash)
values
  ('CMB Airport', 'LOC_001', 10.00, 10.00, true, false),
  ('Hotel Thilon', 'LOC_002', 0.00, 0.00, false, true)
on conflict (code) do nothing;

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
  ('ADDON_001', 'Airport Pickup / Delivery Service',
   'Direct luggage collection or delivery at the airport',
   5.00)
on conflict (code) do nothing;
