<!-- BEGIN:nextjs-agent-rules -->
# Stowaway — Architecture & Engineering Guidelines

Stowaway is a luggage storage/rental booking platform (Sri Lanka, prices shown USD + LKR). Built with Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript, and Supabase (Postgres + Auth). No test suite currently exists — verify changes manually in the browser (`npm run dev`) and with `npm run lint`.

## Design System (Orange & Dark Brown)
- **Primary Accent**: Vibrant Orange (`#EA580C` / `bg-orange-600`). Used for main action CTAs, active pills, highlights, and primary buttons.
- **Dark Surface**: Rich Dark Brown (`#1C130E`). Used for dark bands, dark footers, text headings, and dark promo containers.
- **Card Geometry**: Soft rounded 16px cards (`rounded-2xl`), circular 40px quantity steppers (`rounded-full`), and custom popover dropdowns.
- **No Native Controls**: Never use native `<select>` or native `<input type="date">`. Always use `CustomSelect` (`src/components/ui/CustomSelect.tsx`) and `CustomDatePicker` (`src/components/ui/CustomDatePicker.tsx`).
- Shared primitives live in `src/components/ui/` (`Button`, `Card`, `NavBar`, `PillTag`, `Toast`); booking-flow-specific pieces live in `src/components/booking/`.

## Project Structure

### Pages (`src/app/`)
- `page.tsx`: Marketing Landing Page with Bounce-style Search Hero (`src/components/landing/LandingPage.tsx`).
- `book/page.tsx`: Dedicated 4-Step Booking Engine (Location -> Time -> Items -> Personal Info).
- `booking/[id]/page.tsx`: Single booking detail view.
- `booking/[id]/confirmation/page.tsx`: Booking Confirmation & QR Pass (uses `qrcode`).
- `my-bookings/page.tsx`: Customer Booking History & Support Dashboard (Direct Call & WhatsApp Team actions), looked up by phone number.
- `checkout/[bookingId]/page.tsx`: Final Checkout & Payment Simulation (cash vs. simulated Stripe).
- `admin/page.tsx`: SuperAdmin Control Panel (Item Tiers, Locations, Addons, Time Slots, Audit Log).
- `staff/page.tsx`: Operations Dashboard (48-hour rolling window, booking status transitions).
- `login/page.tsx`: Portal Login for Staff & SuperAdmin (strictly accessed via `/login`; redirects unauthenticated users away from `/staff` and `/admin`).

### API Routes (`src/app/api/`)
- `bookings/route.ts` (`POST`): Creates a booking. Validates locations/times/passport/phone, re-fetches item tier pricing **from the DB** (never trusts client-submitted totals), falls back to hardcoded `tierFallback` rates if the DB is unreachable, then calls `saveBooking`.
- `bookings/[id]/route.ts`: `GET` fetches a booking by id; `PATCH` updates payment method/status via `updateBookingPayment` (server enforces airport-cash lockout regardless of client payload — see Business Rules below).
- `locations/route.ts`, `item-tiers/route.ts`, `addons/route.ts`, `time-slots/route.ts`: CRUD-ish read endpoints backing the booking flow and admin panel.
- `audit-log/route.ts`: Reads `public.audit_log` for the admin panel.
- `exchange-rate/route.ts`: Serves the live USD→LKR rate consumed by `src/lib/currency.ts`.

### Core Logic (`src/lib/`)
- `pricing.ts`: **Single source of truth** for duration and price calculations. Imported by both client components and server API routes — never re-implement duration/fee math elsewhere.
  - `calculateDuration`: bills in whole 24-hour cycles, `Math.ceil`, minimum 1 day.
  - `effectiveDailyRate`: bookings ≤ 7 days use `rate_daily_usd`; bookings > 7 days use `rate_weekly_usd` (labeled "Day Rate (After 7 Days)" in the admin UI) applied to **all** days, not just the extra ones.
  - `calculateGrandTotal` = itemFee + dropoffSurcharge + pickupSurcharge + airportServiceFee + insuranceFee.
- `db.ts`: Supabase data-access layer for bookings (`saveBooking`, `updateBookingPayment`, `getBookingsByPhone`, `getBookingById`). Falls back to an in-memory `MEMORY_BOOKINGS` array when Supabase calls fail — this fallback does **not** persist across server restarts/instances, so treat it as best-effort resilience only, not real storage.
- `timeSlots.ts`: Time slot types (`window` = 2h block, `hourly` = 1h precision) plus `DEFAULT_TIME_SLOTS` and a `localStorage`-backed override (client-side only; server ignores it).
- `currency.ts`: USD↔LKR formatting; fetches the live rate client-side from `/api/exchange-rate` on load and caches it in a module-level variable (falls back to `NEXT_PUBLIC_USD_TO_LKR` env var, default 320).
- `supabase/client.ts` / `supabase/server.ts`: Browser and server Supabase client factories.
- `supabase/types.ts`: Hand-maintained `Database` type mirroring the SQL schema — **keep in sync manually** when migrations change columns (not auto-generated).

### Middleware
- `src/proxy.ts` (Next's middleware entry point): Protects `/staff/:path*` and `/admin/:path*`. Validates the Supabase JWT locally via `getClaims()` (no network round-trip), redirects unauthenticated users to `/login`, and redirects non-`superadmin` roles away from `/admin` to `/staff`. Role resolution order: `app_metadata.role` → `user_metadata.role` → hardcoded fallback (`admin@stowaway.lk` → `superadmin`, else `staff`).

## Business Rules Worth Knowing
- **Airport/CMB cash lockout**: Any booking touching an airport location (`is_airport`, `requires_stripe`, `code === 'LOC_001'`, or id/code containing `"airport"`/`"cmb"`) is forced to `payment_method = stripe_simulated` and `payment_status = paid`, and cash is disallowed — enforced **server-side** in both `saveBooking` and `updateBookingPayment` regardless of what the client sends. Do not weaken this to a client-only check.
- **Pricing is always recalculated server-side** in `POST /api/bookings` from live `item_tiers` rows; client-submitted totals are not trusted (see commit history: "enforce server-side pricing recalculation").
- **Duration billing**: same calendar day = 1 day; crossing a 24h boundary rounds up to the next whole day (see `pricing.ts` doc comment for exact examples).
- Insurance is a flat per-item fee (`insurance_fee_usd`) charged once per unit when `insuranceEnabled`, independent of duration.
- `booking_status` lifecycle: `confirmed` → `in_transit` → `deposited` → `picked_up` (or `cancelled`). Staff dashboard operates on a 48-hour rolling window of these.

## Database Schema (Supabase)
Migrations live in `supabase/migrations/` (`001_schema.sql`, `002_add_insurance_hourly_slots.sql`, `003_public_inserts.sql`); seed data in `supabase/seed.sql`. Ad-hoc RLS/auth patches: `supabase/fix_admin_rls.sql`, `supabase/fix_auth_passwords.sql`. `src/lib/supabase/types.ts` is the authoritative TS shape.

- `public.locations`: Dropoff/pickup points. Flags: `is_airport`, `requires_stripe`, `allows_cash`, plus `dropoff_surcharge_usd` / `pickup_surcharge_usd`.
- `public.time_slots`: Admin-configurable operational windows (`slot_type`: `window`|`hourly`, `day_of_week`, optional `specific_date` override).
- `public.item_tiers`: Pricing catalog — `rate_daily_usd`, `rate_weekly_usd` (post-7-day rate), `insurance_fee_usd`, `display_order`.
- `public.addon_services`: Additional paid services (e.g. airport delivery), `fee_usd`.
- `public.customers`: Verified customer profiles (`phone`, `full_name`, `email`, `passport_number`, OTP fields).
- `public.bookings`: Main reservation table — FKs to `customers`/`locations`, computed totals, `payment_method` (`cash`|`stripe_simulated`), `payment_status`, `booking_status`, `qr_code_token`.
- `public.booking_items`: Line items per booking (tier + quantity + rate snapshot).
- `public.booking_addons`: Addon selections per booking.
- `public.staff`: Portal users — `role` (`staff`|`superadmin`) linked to Supabase Auth `user_id`.
- `public.audit_log`: INSERT/UPDATE/DELETE trail with old/new values, surfaced in the admin panel.

## Deployment Instructions
1. Run `supabase db push` or execute `supabase/migrations/001_schema.sql`, `002_add_insurance_hourly_slots.sql`, `003_public_inserts.sql` (in order) and `supabase/seed.sql` in your Supabase SQL Editor.
2. Deploy to Vercel with environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — check `src/proxy.ts` for the exact key name in use)
   - `NEXT_PUBLIC_USD_TO_LKR` (optional fallback exchange rate; live rate is served by `/api/exchange-rate`)
<!-- END:nextjs-agent-rules -->
