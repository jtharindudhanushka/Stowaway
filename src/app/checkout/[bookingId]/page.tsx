'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { formatUSD, formatLKR } from '@/lib/currency';
import { calculateGrandTotal, calculateDuration, type TierPricing } from '@/lib/pricing';
import {
  CreditCard,
  Banknote,
  Lock,
  CheckCircle2,
  Box,
  Calendar,
  MapPin,
  ShieldCheck,
  AlertCircle,
  ShieldAlert,
  User,
  Phone,
  Mail,
  FileText,
  Plane,
} from 'lucide-react';
import type { BookingRecord } from '@/lib/db';

interface CheckoutSessionData {
  bookingId?: string;
  phone?: string;
  fullName?: string;
  email?: string;
  passportNo?: string;
  notes?: string;
  dropoffLocation?: any;
  pickupLocation?: any;
  dropoffId?: string | null;
  pickupId?: string | null;
  dropoffTime?: string;
  pickupTime?: string;
  quantities?: Record<string, number>;
  selectedTiers?: {
    tierId: string;
    name: string;
    qty: number;
    rateDaily: number;
    rateWeekly: number;
    insuranceFee: number;
  }[];
  insuranceEnabled?: boolean;
  breakdown?: any;
  grandTotalUsd?: number;
  isAirportBooking?: boolean;
  allowsCash?: boolean;
  createdAt?: string;
}

function formatDateTimeDisplay(iso?: string | null): string {
  if (!iso) return 'Not specified';
  try {
    const [dStr, tStr] = iso.split('T');
    if (!dStr) return iso;
    const dateObj = new Date(`${dStr}T00:00:00`);
    const datePart = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    let timePart = tStr ? tStr.slice(0, 5) : '';
    if (timePart) {
      const [h, m] = timePart.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      const minFormatted = m < 10 ? `0${m}` : `${m}`;
      timePart = `${hour12}:${minFormatted} ${ampm}`;
    }
    return `${datePart}${timePart ? ` at ${timePart}` : ''}`;
  } catch {
    return iso;
  }
}

function isAirportCheck(loc: any, allLocs?: any[]): boolean {
  if (!loc) return false;
  if (typeof loc === 'object') {
    if (loc.is_airport === true || loc.code === 'LOC_001' || loc.requires_stripe === true || loc.allows_cash === false) return true;
    const n = (loc.name || '').toLowerCase();
    if (n.includes('airport') || n.includes('cmb') || n.includes('bandaranaike')) return true;
  }
  if (typeof loc === 'string') {
    const s = loc.toLowerCase();
    if (s.includes('airport') || s.includes('cmb') || s === 'loc_001' || s === 'loc-001') return true;
    if (allLocs && allLocs.length > 0) {
      const found = allLocs.find(l => l.id === loc || l.code === loc || l.name === loc);
      if (found) {
        if (found.is_airport === true || found.code === 'LOC_001' || found.requires_stripe === true || found.allows_cash === false) return true;
        if (found.name?.toLowerCase().includes('airport') || found.name?.toLowerCase().includes('cmb')) return true;
      }
    }
  }
  return false;
}

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;

  // 1. Initial State Handoff from SessionStorage
  const [sessionData, setSessionData] = useState<CheckoutSessionData | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('stowaway_checkout_session');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Error reading session data:', e);
      }
    }
    return null;
  });

  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [itemTiers, setItemTiers] = useState<any[]>([]);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash'>('stripe');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Background hydration
  useEffect(() => {
    fetch('/api/locations')
      .then(r => r.json())
      .then(d => setLocations(d.locations || []))
      .catch(console.error);

    fetch('/api/item-tiers')
      .then(r => r.json())
      .then(d => setItemTiers(d.itemTiers || []))
      .catch(console.error);

    if (bookingId && !bookingId.startsWith('bk-')) {
      fetch(`/api/bookings/${bookingId}`)
        .then(res => res.json())
        .then(data => {
          if (data.booking) setBooking(data.booking);
        })
        .catch(console.error);
    }
  }, [bookingId]);

  // Derive Locations
  const dropoffLoc = useMemo(() => {
    if (sessionData?.dropoffLocation) return sessionData.dropoffLocation;
    const dId = sessionData?.dropoffId || booking?.dropoffLocationId;
    return locations.find(l => l.id === dId || l.code === dId || l.name === dId) || null;
  }, [sessionData, booking, locations]);

  const pickupLoc = useMemo(() => {
    if (sessionData?.pickupLocation) return sessionData.pickupLocation;
    const pId = sessionData?.pickupId || booking?.pickupLocationId;
    return locations.find(l => l.id === pId || l.code === pId || l.name === pId) || null;
  }, [sessionData, booking, locations]);

  // Robust Airport Lockout Check
  const isAirportBooking = useMemo(() => {
    return Boolean(
      sessionData?.isAirportBooking ||
      booking?.isAirportBooking ||
      isAirportCheck(dropoffLoc, locations) ||
      isAirportCheck(pickupLoc, locations) ||
      isAirportCheck(sessionData?.dropoffId, locations) ||
      isAirportCheck(sessionData?.pickupId, locations) ||
      isAirportCheck(booking?.dropoffLocationId, locations) ||
      isAirportCheck(booking?.pickupLocationId, locations)
    );
  }, [sessionData, booking, dropoffLoc, pickupLoc, locations]);

  const allowsCash = !isAirportBooking;

  useEffect(() => {
    if (!allowsCash) {
      setPaymentMethod('stripe');
    }
  }, [allowsCash]);

  // Storage Times
  const dropoffTime = sessionData?.dropoffTime || booking?.dropoffTime || '';
  const pickupTime = sessionData?.pickupTime || booking?.pickupTime || '';

  // Duration
  const duration = useMemo(() => {
    if (sessionData?.breakdown?.duration) return sessionData.breakdown.duration;
    if (dropoffTime && pickupTime) return calculateDuration(dropoffTime, pickupTime);
    return { billableUnit: 'days', count: 1, label: '1 day' };
  }, [sessionData, dropoffTime, pickupTime]);

  // Stored Items
  const itemsList = useMemo(() => {
    if (sessionData?.selectedTiers && sessionData.selectedTiers.length > 0) {
      return sessionData.selectedTiers;
    }
    if (sessionData?.quantities && itemTiers.length > 0) {
      return Object.entries(sessionData.quantities)
        .filter(([_, q]) => q > 0)
        .map(([tierId, qty]) => {
          const tier = itemTiers.find(t => t.id === tierId);
          return {
            tierId,
            qty,
            name: tier?.name || 'Stored Item',
            rateDaily: tier?.rate_daily_usd ?? 3.0,
            rateWeekly: tier?.rate_weekly_usd ?? 2.4,
            insuranceFee: tier?.insurance_fee_usd ?? 2.4,
          };
        });
    }
    if (booking?.items && booking.items.length > 0 && itemTiers.length > 0) {
      return booking.items.map((it: any) => {
        const tier = itemTiers.find(t => t.id === it.tierId);
        return {
          tierId: it.tierId,
          qty: it.qty,
          name: tier?.name || 'Stored Item',
          rateDaily: tier?.rate_daily_usd ?? 3.0,
          rateWeekly: tier?.rate_weekly_usd ?? 2.4,
          insuranceFee: tier?.insurance_fee_usd ?? 2.4,
        };
      });
    }
    return [];
  }, [sessionData, booking, itemTiers]);

  // Breakdown Calculations
  const breakdown = useMemo(() => {
    if (sessionData?.breakdown) return sessionData.breakdown;

    const days = Math.max(1, duration.count || 1);
    const dropoffSurcharge = dropoffLoc?.dropoff_surcharge_usd ?? 0;
    const pickupSurcharge = pickupLoc?.pickup_surcharge_usd ?? 0;
    const insuranceEnabled = sessionData?.insuranceEnabled ?? booking?.insuranceEnabled ?? false;

    let itemFee = 0;
    let insuranceFee = 0;

    itemsList.forEach(it => {
      const rate = days > 7 ? it.rateWeekly : it.rateDaily;
      itemFee += rate * it.qty * days;
      if (insuranceEnabled) {
        insuranceFee += it.insuranceFee * it.qty;
      }
    });

    const grandTotal = itemFee + dropoffSurcharge + pickupSurcharge + insuranceFee;

    return {
      duration,
      itemFee,
      dropoffSurcharge,
      pickupSurcharge,
      airportServiceFee: 0,
      insuranceFee,
      grandTotal,
    };
  }, [sessionData, booking, duration, dropoffLoc, pickupLoc, itemsList]);

  const grandTotal = sessionData?.grandTotalUsd || booking?.grandTotalUsd || breakdown.grandTotal || 0;

  // Customer Contact Info
  const customerName = sessionData?.fullName || booking?.fullName || 'Valued Guest';
  const customerPhone = sessionData?.phone || booking?.phone || '+94 77 123 4567';
  const customerEmail = sessionData?.email || booking?.email || '';
  const customerPassport = sessionData?.passportNo || booking?.passportNo || '';

  const handleConfirm = async () => {
    setError('');
    if (paymentMethod === 'stripe') {
      const cleanCard = cardNumber.replace(/\D/g, '');
      if (cleanCard.length < 12) {
        setError('Please enter a valid 16-digit card number.');
        return;
      }
      if (!expiry || expiry.length < 4) {
        setError('Please enter a valid card expiry date (MM/YY).');
        return;
      }
      if (!cvv || cvv.length < 3) {
        setError('Please enter a valid CVV security code.');
        return;
      }
    }

    setLoading(true);
    const effectiveBookingId = sessionData?.bookingId || bookingId;

    try {
      if (effectiveBookingId && !effectiveBookingId.startsWith('bk-')) {
        await fetch(`/api/bookings/${effectiveBookingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethod,
            paymentStatus: paymentMethod === 'stripe' ? 'paid' : 'pending',
          }),
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Payment update exception:', e);
    }

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('stowaway_checkout_session');
      sessionStorage.removeItem('stowaway_booking_state');
    }

    setLoading(false);
    router.push(`/booking/${effectiveBookingId}/confirmation?pm=${paymentMethod}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <NavBar />

      <main className="max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6" id="checkout-main">
        {/* Header */}
        <div className="mb-8">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 mb-3 inline-block uppercase tracking-wider">
            Final Step
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1C130E] tracking-tight">Complete your booking</h1>
          <p className="text-base text-slate-600 mt-2 font-medium">
            Review your full reservation summary and select your payment method.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left: Payment Method Form */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Select Payment Method</h2>

              <div className="flex flex-col gap-4">
                {/* Stripe Option */}
                <label
                  className={[
                    'flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all',
                    paymentMethod === 'stripe' ? 'border-orange-600 bg-orange-50/50 shadow-xs' : 'border-slate-200 hover:border-slate-300',
                  ].join(' ')}
                  id="payment-stripe-label"
                >
                  <input
                    type="radio"
                    name="payment"
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={() => setPaymentMethod('stripe')}
                    className="accent-orange-600 w-4 h-4 cursor-pointer"
                    id="payment-stripe"
                  />
                  <CreditCard className="w-6 h-6 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-base font-bold text-slate-900">Credit / Debit Card (Stripe)</p>
                    <p className="text-xs font-medium text-slate-500">Instant confirmation & 256-bit SSL encrypted</p>
                  </div>
                  <span className="ml-auto text-xs font-bold px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full">
                    Recommended
                  </span>
                </label>

                {/* Cash on Drop-off (Enabled only for non-airport) */}
                {allowsCash ? (
                  <label
                    className={[
                      'flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all',
                      paymentMethod === 'cash' ? 'border-orange-600 bg-orange-50/50 shadow-xs' : 'border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                    id="payment-cash-label"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="accent-orange-600 w-4 h-4 cursor-pointer"
                      id="payment-cash"
                    />
                    <Banknote className="w-6 h-6 text-slate-700 flex-shrink-0" />
                    <div>
                      <p className="text-base font-bold text-slate-900">Cash on Drop-off</p>
                      <p className="text-xs font-medium text-slate-500">
                        Pay in cash upon dropping off your items at facility
                      </p>
                    </div>
                  </label>
                ) : (
                  /* Prominent Amber Notice when CMB Airport is involved */
                  <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-start gap-3.5 text-amber-950 shadow-xs">
                    <div className="w-8 h-8 rounded-full bg-amber-200/80 flex items-center justify-center flex-shrink-0 text-amber-900 mt-0.5 font-black text-sm">
                      <Lock className="w-4 h-4 text-amber-900" />
                    </div>
                    <div>
                      <p className="font-extrabold text-amber-950 text-sm">Card Payment Required (CMB Airport)</p>
                      <p className="text-xs font-semibold text-amber-900/90 mt-1 leading-relaxed">
                        Due to official airport security protocols and baggage check-in regulations at CMB Airport Storage Hub, cash payments are strictly not accepted for airport bookings. Online card payment is required.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card details simulation */}
            {paymentMethod === 'stripe' && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs animate-fade-in">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Payment Card Details</h2>
                <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-xs font-semibold text-emerald-900">
                    <strong>Demo Simulation</strong> — You can use any test card number (e.g. 4242...).
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="card-number" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Card Number
                    </label>
                    <input
                      id="card-number"
                      type="text"
                      inputMode="numeric"
                      maxLength={19}
                      value={cardNumber}
                      onChange={e => {
                        setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim());
                        setError('');
                      }}
                      placeholder="4242 4242 4242 4242"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-600 focus:bg-white focus:ring-2 focus:ring-orange-600/20 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="card-expiry" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Expiry
                      </label>
                      <input
                        id="card-expiry"
                        type="text"
                        maxLength={5}
                        value={expiry}
                        onChange={e => {
                          setExpiry(e.target.value);
                          setError('');
                        }}
                        placeholder="MM/YY"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-600 focus:bg-white focus:ring-2 focus:ring-orange-600/20 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="card-cvv" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        CVV / CVC
                      </label>
                      <input
                        id="card-cvv"
                        type="text"
                        maxLength={4}
                        value={cvv}
                        onChange={e => {
                          setCvv(e.target.value);
                          setError('');
                        }}
                        placeholder="123"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-600 focus:bg-white focus:ring-2 focus:ring-orange-600/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs font-bold text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleConfirm}
              loading={loading}
              id="confirm-pay-btn"
              className="py-4 text-base font-black shadow-sm cursor-pointer"
            >
              {loading
                ? 'Processing Reservation...'
                : paymentMethod === 'cash'
                ? `Confirm Reservation — Pay ${formatUSD(grandTotal)} Cash at Drop-off`
                : `Confirm & Pay — ${formatUSD(grandTotal)}`}
            </Button>

            <p className="text-xs text-center text-slate-500 font-medium flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              <span>Protected by 256-bit bank level encryption</span>
            </p>
          </div>

          {/* Right: Comprehensive Order Summary matching PriceSummaryPanel */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-[#1C130E] shadow-xl sticky top-24">
              <h2 className="text-xl font-black text-[#1C130E] mb-5">Order Summary</h2>

              <div className="flex flex-col gap-4 text-xs font-semibold">
                {/* Drop-off Location */}
                <div className="flex items-start gap-2.5 pb-3 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Drop-off Location</p>
                    <p className="text-slate-900 font-extrabold text-sm truncate">
                      {dropoffLoc?.name || 'Storage Point'}
                    </p>
                    <p className="text-slate-600 font-semibold text-[11px] mt-0.5">
                      {formatDateTimeDisplay(dropoffTime)}
                    </p>
                    {breakdown.dropoffSurcharge > 0 && (
                      <p className="text-orange-600 font-bold text-[11px] mt-0.5">
                        +{formatUSD(breakdown.dropoffSurcharge)} drop-off surcharge
                      </p>
                    )}
                  </div>
                </div>

                {/* Pick-up Location */}
                <div className="flex items-start gap-2.5 pb-3 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Pick-up Location</p>
                    <p className="text-slate-900 font-extrabold text-sm truncate">
                      {pickupLoc?.name || 'Pick-up Point'}
                    </p>
                    <p className="text-slate-600 font-semibold text-[11px] mt-0.5">
                      {formatDateTimeDisplay(pickupTime)}
                    </p>
                    {breakdown.pickupSurcharge > 0 && (
                      <p className="text-orange-600 font-bold text-[11px] mt-0.5">
                        +{formatUSD(breakdown.pickupSurcharge)} pick-up surcharge
                      </p>
                    )}
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <span className="text-slate-900 font-bold">Storage Duration</span>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-950 font-black rounded-full text-xs">
                    {duration.label}
                  </span>
                </div>

                {/* Stored Items List */}
                {itemsList.length > 0 ? (
                  <div className="flex flex-col gap-2.5 pb-3 border-b border-slate-100">
                    <p className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-orange-600" /> Stored Items & Quantities
                    </p>
                    {itemsList.map(it => {
                      const days = Math.max(1, duration.count || 1);
                      const rate = days > 7 ? it.rateWeekly : it.rateDaily;
                      const lineTotal = rate * it.qty * days;
                      return (
                        <div key={it.tierId} className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-extrabold text-slate-800">{it.qty}× {it.name}</span>
                            <span className="text-[10px] text-slate-500 font-semibold ml-1.5">
                              ({formatUSD(rate)}/day × {days}d)
                            </span>
                          </div>
                          <span className="font-black text-slate-900">{formatUSD(lineTotal)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex justify-between items-center py-1 text-xs pb-3 border-b border-slate-100">
                    <span className="font-bold text-slate-800">Storage Items</span>
                    <span className="font-extrabold text-slate-900">{formatUSD(breakdown.itemFee || 0)}</span>
                  </div>
                )}

                {/* Airport Delivery Service */}
                {breakdown.airportServiceFee > 0 && (
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5 text-orange-600" /> Airport Delivery Service
                    </span>
                    <span className="font-extrabold text-slate-900">+{formatUSD(breakdown.airportServiceFee)}</span>
                  </div>
                )}

                {/* Insurance Add-on */}
                {(sessionData?.insuranceEnabled || booking?.insuranceEnabled) && breakdown.insuranceFee > 0 && (
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Item Insurance Protection
                    </span>
                    <span className="font-extrabold text-emerald-700">+{formatUSD(breakdown.insuranceFee)}</span>
                  </div>
                )}

                {/* Grand Total */}
                <div className="pt-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-black text-[#1C130E]">Grand Total</span>
                    <div className="text-right">
                      <p className="text-3xl font-black text-orange-600">{formatUSD(grandTotal)}</p>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">{formatLKR(grandTotal)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Contact Badge */}
              <div className="border-t border-slate-200 pt-5 mt-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</p>
                    <p className="text-xs font-bold text-slate-900 truncate">{customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp Number</p>
                    <p className="text-xs font-bold text-slate-900 truncate">{customerPhone}</p>
                  </div>
                </div>
                {customerEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Email Address</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{customerEmail}</p>
                    </div>
                  </div>
                )}
                {customerPassport && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Passport / NIC</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{customerPassport}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
