<!-- BEGIN:nextjs-agent-rules -->
# Stowaway — Architecture & Engineering Guidelines

This application is built with Next.js (App Router), React 19, Tailwind CSS v4, and Supabase.

## Design System (Orange & Dark Brown)
- **Primary Accent**: Vibrant Orange (`#EA580C` / `bg-orange-600`). Used for main action CTAs, active pills, highlights, and primary buttons.
- **Dark Surface**: Rich Dark Brown (`#1C130E`). Used for dark bands, dark footers, text headings, and dark promo containers.
- **Card Geometry**: Soft rounded 16px cards (`rounded-2xl`), circular 40px quantity steppers (`rounded-full`), and custom popover dropdowns.
- **No Native Controls**: Never use native `<select>` or native `<input type="date">`. Always use `CustomSelect` and `CustomDatePicker`.

## Project Structure
- `src/app/page.tsx`: Marketing Landing Page with Bounce-style Search Hero.
- `src/app/book/page.tsx`: Dedicated 4-Step Booking Engine (Location -> Time -> Items -> Personal Info).
- `src/app/my-bookings/page.tsx`: Customer Booking History & Support Dashboard (Direct Call & WhatsApp Team actions).
- `src/app/checkout/[bookingId]/page.tsx`: Final Checkout & Payment Simulation.
- `src/app/booking/[id]/confirmation/page.tsx`: Booking Confirmation & QR Pass.
- `src/app/admin/page.tsx`: SuperAdmin Control Panel (Item Tiers, Locations, Addons, Time Slots, Audit Log).
- `src/app/staff/page.tsx`: Operations Dashboard (48-hour rolling window, status transitions).
- `src/app/login/page.tsx`: Portal Login for Staff & SuperAdmin (strictly accessed via `/login`).

## Database Schema (Supabase)
- `public.locations`: Dropoff/pickup location points.
- `public.time_slots`: Admin configurable operational time windows.
- `public.item_tiers`: Pricing catalog for storage item tiers.
- `public.addon_services`: Additional services (e.g. Airport delivery).
- `public.customers`: Verified customer profiles (phone, full_name, email, passport_number).
- `public.bookings`: Main reservation table.

## Deployment Instructions
1. Run `supabase db push` or execute `supabase/migrations/001_schema.sql` and `supabase/seed.sql` in your Supabase SQL Editor.
2. Deploy to Vercel with environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
<!-- END:nextjs-agent-rules -->
