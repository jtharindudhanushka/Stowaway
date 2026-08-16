'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { formatUSD, formatLKR } from '@/lib/currency';
import { CreditCard, Banknote, Lock, CheckCircle2, Box, CalendarDays, MapPin, ShieldCheck, AlertCircle } from 'lucide-react';
import type { BookingRecord } from '@/lib/db';

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [booking, setBooking]       = useState<BookingRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash'>('stripe');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvv, setCvv]               = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then(res => res.json())
      .then(data => {
        if (data.booking) setBooking(data.booking);
      })
      .catch(console.error);
  }, [bookingId]);

  const isAirportBooking = Boolean(
    booking?.isAirportBooking ||
    booking?.allowsCash === false ||
    booking?.dropoffLocationId?.toLowerCase().includes('airport') ||
    booking?.pickupLocationId?.toLowerCase().includes('airport') ||
    booking?.dropoffLocationId === 'loc-001' ||
    booking?.pickupLocationId === 'loc-001'
  );
  const allowsCash = !isAirportBooking && booking?.allowsCash !== false;

  useEffect(() => {
    if (booking && !allowsCash) {
      setPaymentMethod('stripe');
    }
  }, [booking, allowsCash]);

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
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    router.push(`/booking/${bookingId}/confirmation?pm=${paymentMethod}`);
  };

  const grandTotal = booking?.grandTotalUsd || 33.00;

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
            Review your reservation details and confirm payment method.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left: payment form */}
          <div className="lg:col-span-3 flex flex-col gap-6">

            {/* Payment method */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Payment Method</h2>

              <div className="flex flex-col gap-4">
                {/* Stripe */}
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
                    <p className="text-xs font-medium text-slate-500">Instant, 256-bit SSL encrypted</p>
                  </div>
                  <span className="ml-auto text-xs font-bold px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full">Recommended</span>
                </label>

                {/* Cash on Drop-off (only if cash allowed / not airport) */}
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
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
                    <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">Card Payment Required for CMB Airport</p>
                      <p className="text-amber-800 mt-0.5">
                        Due to airport regulations and security verification, reservations involving CMB Airport require online card payment. Cash is not available.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card details (simulated) */}
            {paymentMethod === 'stripe' && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Card Details</h2>
                <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-xs font-semibold text-emerald-900">
                    <strong>Demo Simulation</strong> — enter any test card number.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="card-number" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Card Number</label>
                    <input
                      id="card-number"
                      type="text"
                      inputMode="numeric"
                      maxLength={19}
                      value={cardNumber}
                      onChange={e => { setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim()); setError(''); }}
                      placeholder="4242 4242 4242 4242"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-600 focus:bg-white focus:ring-2 focus:ring-orange-600/20 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="card-expiry" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Expiry</label>
                      <input
                        id="card-expiry"
                        type="text"
                        maxLength={5}
                        value={expiry}
                        onChange={e => { setExpiry(e.target.value); setError(''); }}
                        placeholder="MM/YY"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-600 focus:bg-white focus:ring-2 focus:ring-orange-600/20 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="card-cvv" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">CVV</label>
                      <input
                        id="card-cvv"
                        type="text"
                        maxLength={4}
                        value={cvv}
                        onChange={e => { setCvv(e.target.value); setError(''); }}
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
              className="py-4 text-base font-black shadow-sm"
            >
              {loading ? 'Confirming Reservation...' : `Confirm & Pay — ${formatUSD(grandTotal)}`}
            </Button>
            <p className="text-xs text-center text-slate-500 font-medium flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              <span>Protected by 256-bit bank level encryption</span>
            </p>
          </div>

          {/* Right: order summary */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl border-2 border-[#1C130E] shadow-lg">
              <h2 className="text-xl font-black text-[#1C130E] mb-6">Order Summary</h2>

              <div className="flex flex-col gap-3 mb-6">
                {booking?.items && booking.items.length > 0 ? (
                  booking.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 text-xs">
                      <span className="font-bold text-slate-900">
                        {item.qty}× Stored Item
                      </span>
                      <span className="font-extrabold text-slate-900">{formatUSD(item.qty * 3.5 * 2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-center py-1 text-xs">
                    <span className="font-bold text-slate-900">2× Luggage Storage</span>
                    <span className="font-extrabold text-slate-900">{formatUSD(18.00)}</span>
                  </div>
                )}

                {booking && Number(booking.airportServiceUsd) > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span>Airport Delivery Service</span>
                    <span className="font-bold text-slate-900">+{formatUSD(Number(booking.airportServiceUsd))}</span>
                  </div>
                )}

                {booking && booking.insuranceEnabled && Number(booking.insuranceTotalUsd) > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold text-emerald-700">
                    <span>Item Insurance Protection</span>
                    <span className="font-bold text-emerald-700">+{formatUSD(Number(booking.insuranceTotalUsd))}</span>
                  </div>
                )}

                <div className="border-t-2 border-slate-900 my-2" />
                <div className="flex justify-between items-start pt-1">
                  <span className="text-base font-black text-slate-900">Grand Total</span>
                  <div className="text-right">
                    <p className="text-3xl font-black text-orange-600">{formatUSD(grandTotal)}</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{formatLKR(grandTotal)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Box className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Customer Phone</p>
                    <p className="text-sm font-bold text-slate-900">{booking?.phone || '+94 77 123 4567'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Drop-off & Pick-up</p>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {booking?.dropoffLocationId || 'Storage Point'} → {booking?.pickupLocationId || 'Pick-up Point'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Status</p>
                    <p className="text-sm font-bold text-emerald-600">Active Reservation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
