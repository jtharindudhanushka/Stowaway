'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { NavBar } from '@/components/ui/NavBar';
import { PillTag } from '@/components/ui/PillTag';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ItemSelector, type ItemTier, type DurationType } from '@/components/booking/ItemSelector';
import { DurationPicker } from '@/components/booking/DurationPicker';
import { LocationSelector, type Location } from '@/components/booking/LocationSelector';
import { AddOnToggle } from '@/components/booking/AddOnToggle';
import { PriceSummaryPanel } from '@/components/booking/PriceSummaryPanel';
import { OtpBottomSheet } from '@/components/auth/OtpBottomSheet';

// ── Static seed data (will be replaced by Supabase fetch once configured) ──
const ITEM_TIERS: ItemTier[] = [
  { id: 'item-001', code: 'ITEM_001', name: 'Small Bag / Documents',  description: 'Laptops, handbags, document files', supported_items: 'Laptop, handbag, document files, small totes',  weight_spec: 'Standard personal item', icon_emoji: '💼', rate_daily_usd: 1.00, rate_weekly_usd: 5.00,  rate_monthly_usd: 25.00 },
  { id: 'item-002', code: 'ITEM_002', name: 'Carry-On Luggage',       description: 'Standard carry-on, backpacks, trolleys', supported_items: 'Carry-on suitcases, backpacks, trolleys',       weight_spec: 'Max 15 kg',              icon_emoji: '🧳', rate_daily_usd: 2.00, rate_weekly_usd: 10.00, rate_monthly_usd: 45.00 },
  { id: 'item-003', code: 'ITEM_003', name: 'Large Suitcase',         description: 'Extra-large and check-in luggage',      supported_items: 'Extra-large luggage, heavy check-in suitcases', weight_spec: 'Max 40 kg',              icon_emoji: '🗃️', rate_daily_usd: 3.50, rate_weekly_usd: 18.00, rate_monthly_usd: 75.00 },
  { id: 'item-004', code: 'ITEM_004', name: 'Odd-Sized Items',        description: 'Bicycles, golf bags, surfboards',       supported_items: 'Foldable bicycles, golf bags, baby car seats, surfboards', weight_spec: 'Non-standard dimensions', icon_emoji: '🚲', rate_daily_usd: 5.00, rate_weekly_usd: 25.00, rate_monthly_usd: 100.00 },
  { id: 'item-005', code: 'ITEM_005', name: 'Tea Chest Box',          description: 'Storage crates, bulk boxes',            supported_items: 'Standard tea chest size boxes, storage crates',  weight_spec: 'Heavy / bulky volume',   icon_emoji: '📦', rate_daily_usd: 4.00, rate_weekly_usd: 20.00, rate_monthly_usd: 85.00 },
];

const LOCATIONS: Location[] = [
  { id: 'loc-001', code: 'LOC_001', name: 'CMB Airport',   dropoff_surcharge_usd: 10, pickup_surcharge_usd: 10, requires_stripe: true,  allows_cash: false },
  { id: 'loc-002', code: 'LOC_002', name: 'Hotel Thilon',  dropoff_surcharge_usd: 0,  pickup_surcharge_usd: 0,  requires_stripe: false, allows_cash: true  },
];

const AIRPORT_PICKUP_FEE = 5.00;

const TRUST_POINTS = [
  { icon: '🔐', title: 'Our own secure storage facility', desc: 'Your luggage is stored at a facility owned and operated by us. No third parties involved.' },
  { icon: '🕐', title: '24/7 drop-off and collection',   desc: 'Drop off and collect your luggage at any time — no restrictions on your travel schedule.' },
  { icon: '📍', title: 'Conveniently near the airport',  desc: 'Approximately 2 km from CMB Airport — just a 5–10 minute journey away.' },
  { icon: '✈️', title: 'Airport pickup & delivery',      desc: 'We collect from or deliver to the airport for a small flat fee.' },
  { icon: '💳', title: 'Flexible payment options',       desc: 'We accept foreign currencies and secure card payments through our payment app.' },
];

const FEATURE_CARDS = [
  { icon: '🛡️', title: 'Military-grade security', body: 'CCTV coverage, tamper-evident seals, and staff on-site 24 hours a day.' },
  { icon: '📱', title: 'Digital receipts & QR tracking', body: 'Your booking generates a unique QR code for instant drop-off verification.' },
  { icon: '🌏', title: 'Multilingual staff',             body: 'Our team speaks English, Sinhala, and Tamil to assist every traveller.' },
];

export function LandingPage() {
  const router = useRouter();
  const bookingRef = useRef<HTMLDivElement>(null);

  // Booking state
  const [quantities,     setQuantities]     = useState<Record<string, number>>({});
  const [durationType,   setDurationType]   = useState<DurationType>('daily');
  const [durationValue,  setDurationValue]  = useState(1);
  const [dropoffId,      setDropoffId]      = useState<string | null>(null);
  const [pickupId,       setPickupId]       = useState<string | null>(null);
  const [airportPickup,  setAirportPickup]  = useState(false);
  const [otpOpen,        setOtpOpen]        = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const scrollToBooking = useCallback(() => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleQuantityChange = useCallback((tierId: string, delta: number) => {
    setQuantities(prev => {
      const next = { ...prev };
      const current = next[tierId] ?? 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) delete next[tierId]; else next[tierId] = updated;
      return next;
    });
  }, []);

  const handleBookNow = () => {
    setOtpOpen(true);
  };

  const handleOtpVerified = async (customerId: string) => {
    setOtpOpen(false);
    setBookingLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          dropoffLocationId: dropoffId,
          pickupLocationId: pickupId,
          durationType,
          durationValue,
          items: Object.entries(quantities).map(([tierId, qty]) => ({ tierId, qty })),
          airportPickup,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Booking failed');
      router.push(`/checkout/${data.bookingId}`);
    } catch (err) {
      console.error(err);
      // Navigate to checkout with a pending state even on error for demo
      router.push('/checkout/demo');
    } finally {
      setBookingLoading(false);
    }
  };

  const dropoffLocation = LOCATIONS.find(l => l.id === dropoffId) ?? null;
  const pickupLocation  = LOCATIONS.find(l => l.id === pickupId)  ?? null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Navigation ────────────────────────────────────── */}
      <NavBar variant="dark" showStaffLogin showBookNow onBookNow={scrollToBooking} />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        className="relative canvas-night overflow-hidden"
        style={{ minHeight: '90dvh' }}
        aria-label="Hero section"
      >
        {/* Full-bleed hero image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero.png"
            alt="Stowaway secure luggage storage facility"
            fill
            priority
            className="object-cover opacity-50"
            sizes="100vw"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        </div>

        {/* Content */}
        <div
          className="relative z-10 container-content flex flex-col justify-end pb-16 pt-32"
          style={{ minHeight: '90dvh' }}
        >
          <div className="max-w-3xl animate-fade-in-up">
            <PillTag variant="mint" className="mb-6">
              Colombo · CMB Airport · Est. 2026
            </PillTag>

            <h1 className="text-display-xxl text-white mb-6">
              Store light.{' '}
              <br className="hidden sm:block" />
              Travel free.
            </h1>

            <p className="text-body-lg text-white/70 mb-8 max-w-lg">
              Sri Lanka&apos;s premier luggage storage service — secure, flexible,
              and just minutes from Colombo International Airport.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="aloe"
                size="lg"
                onClick={scrollToBooking}
                id="hero-book-now"
              >
                Book Storage Now
              </Button>
              <Button
                variant="outline-dark"
                size="lg"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                id="hero-how-it-works"
              >
                See How It Works
              </Button>
            </div>

            {/* Trust micro-stats */}
            <div className="flex flex-wrap gap-6 mt-10 pt-8 border-t border-white/10">
              {[
                { label: '2 km from airport', icon: '📍' },
                { label: '24/7 access',         icon: '🕐' },
                { label: 'Fully insured',        icon: '🔐' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-caption text-white/60">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Booking Widget ────────────────────────────────── */}
      <section
        id="booking"
        ref={bookingRef}
        className="canvas-cream py-16"
        aria-label="Booking widget"
        style={{ scrollMarginTop: '80px' }}
      >
        <div className="container-content">
          <div className="mb-10 text-center">
            <PillTag variant="mint" className="mb-3">Book Storage</PillTag>
            <h2 className="text-display-lg text-black">Choose your storage</h2>
            <p className="text-body-md text-[#52525b] mt-2">
              Select items, set your duration, and choose locations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left: selectors */}
            <div className="lg:col-span-2 flex flex-col gap-8">

              {/* Items */}
              <div>
                <h3 className="text-heading-md font-[500] text-black mb-4 flex items-center gap-2">
                  <span>1.</span> What are you storing?
                </h3>
                <ItemSelector
                  tiers={ITEM_TIERS}
                  quantities={quantities}
                  durationType={durationType}
                  onQuantityChange={handleQuantityChange}
                />
              </div>

              {/* Duration */}
              <div>
                <h3 className="text-heading-md font-[500] text-black mb-4 flex items-center gap-2">
                  <span>2.</span> How long?
                </h3>
                <DurationPicker
                  durationType={durationType}
                  durationValue={durationValue}
                  onTypeChange={setDurationType}
                  onValueChange={setDurationValue}
                />
              </div>

              {/* Locations */}
              <div>
                <h3 className="text-heading-md font-[500] text-black mb-4 flex items-center gap-2">
                  <span>3.</span> Drop-off &amp; pick-up
                </h3>
                <LocationSelector
                  locations={LOCATIONS}
                  dropoffId={dropoffId}
                  pickupId={pickupId}
                  onDropoffChange={setDropoffId}
                  onPickupChange={setPickupId}
                />
              </div>

              {/* Add-on */}
              <div>
                <h3 className="text-heading-md font-[500] text-black mb-4 flex items-center gap-2">
                  <span>4.</span> Add-ons
                </h3>
                <AddOnToggle
                  enabled={airportPickup}
                  onChange={setAirportPickup}
                  feeUsd={AIRPORT_PICKUP_FEE}
                />
              </div>
            </div>

            {/* Right: sticky price panel */}
            <div className="lg:col-span-1">
              <PriceSummaryPanel
                tiers={ITEM_TIERS}
                quantities={quantities}
                durationType={durationType}
                durationValue={durationValue}
                dropoffLocation={dropoffLocation}
                pickupLocation={pickupLocation}
                airportPickupEnabled={airportPickup}
                airportPickupFee={AIRPORT_PICKUP_FEE}
                onBookNow={handleBookNow}
                isLoading={bookingLoading}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust & Value Section ─────────────────────────── */}
      <section
        id="how-it-works"
        className="py-20"
        style={{ backgroundColor: '#d4f9e0' }}
        aria-label="Why choose Stowaway"
      >
        <div className="container-content">
          <div className="text-center mb-12">
            <PillTag variant="mint" className="mb-3">Why Choose Us</PillTag>
            <h2 className="text-display-md text-black">
              Why choose Stowaway for your{' '}
              <br className="hidden sm:block" />
              luggage storage?
            </h2>
            <p className="text-body-lg text-[#52525b] mt-4 max-w-xl mx-auto">
              Your luggage. Our facility. Your peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {TRUST_POINTS.map(({ icon, title, desc }) => (
              <Card key={title} variant="pricing" className="animate-fade-in-up">
                <span className="text-3xl mb-4 block">{icon}</span>
                <h3 className="text-heading-md font-[500] text-black mb-2">{title}</h3>
                <p className="text-body-md text-[#52525b]">{desc}</p>
              </Card>
            ))}
          </div>

          <p className="text-center text-body-lg text-[#52525b] mt-12 font-[550] italic">
            Travel light. Store with confidence.
          </p>
        </div>
      </section>

      {/* ── Cinematic Feature Band ────────────────────────── */}
      <section
        id="locations"
        className="canvas-night py-24"
        aria-label="Feature highlights"
      >
        <div className="container-content">
          <div className="text-center mb-14">
            <PillTag variant="dark" className="mb-4">Our Promise</PillTag>
            <h2 className="text-display-xl text-white">
              Your luggage.{' '}
              <br className="hidden sm:block" />
              Our responsibility.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
            {FEATURE_CARDS.map(({ icon, title, body }) => (
              <Card key={title} variant="cinematic" className="animate-fade-in-up">
                <span className="text-4xl mb-6 block">{icon}</span>
                <h3 className="text-heading-xl text-white mb-3">{title}</h3>
                <p className="text-body-md text-white/60">{body}</p>
              </Card>
            ))}
          </div>

          {/* CTA band */}
          <div className="mt-16 text-center">
            <Button
              variant="aloe"
              size="lg"
              onClick={scrollToBooking}
              id="cta-band-book"
            >
              Book Your Storage
            </Button>
            <p className="text-caption text-white/40 mt-4">
              Starting from $1.00 / Rs. 320 per day
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="canvas-night border-t border-[#1e2c31]" aria-label="Footer">
        <div className="container-content py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <p
                className="text-2xl text-white mb-3"
                style={{ fontFamily: 'Inter Display, Inter, sans-serif', fontWeight: 300, letterSpacing: '-0.5px' }}
              >
                Stowaway
              </p>
              <p className="text-caption text-[#9dabad] max-w-xs">
                Secure luggage storage near Colombo International Airport.
                Serving travellers 24/7.
              </p>
            </div>

            {/* Links */}
            <div>
              <p className="text-eyebrow text-white/40 mb-4">Navigate</p>
              <ul className="flex flex-col gap-3">
                {['Book Storage', 'How It Works', 'Pricing', 'Locations'].map(l => (
                  <li key={l}>
                    <a href="#booking" className="text-caption text-[#9797a2] hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-eyebrow text-white/40 mb-4">Contact</p>
              <ul className="flex flex-col gap-3">
                <li className="text-caption text-[#9797a2]">📍 2 km from CMB Airport</li>
                <li className="text-caption text-[#9797a2]">🏨 Hotel Thilon, Colombo</li>
                <li>
                  <a href="/login" className="text-caption text-[#99b3ad] hover:text-white transition-colors underline">
                    Staff Login →
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#1e2c31] mt-12 pt-6 flex flex-col sm:flex-row justify-between gap-3">
            <p className="text-micro text-[#52525b]">
              © {new Date().getFullYear()} Stowaway. All rights reserved.
            </p>
            <p className="text-micro text-[#52525b]">
              Secure · Reliable · Always Available
            </p>
          </div>
        </div>
      </footer>

      {/* ── OTP Sheet ─────────────────────────────────────── */}
      <OtpBottomSheet
        isOpen={otpOpen}
        onClose={() => setOtpOpen(false)}
        onVerified={handleOtpVerified}
      />
    </div>
  );
}
