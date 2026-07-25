'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { PillTag } from '@/components/ui/PillTag';
import { formatUSD, formatLKR } from '@/lib/currency';
import { CreditCard, Banknote, Lock, CheckCircle2, Box, CalendarDays, MapPin } from 'lucide-react';

const DEMO_BOOKING = {
  id: 'demo',
  items: [
    { name: 'Carry-On Luggage', qty: 2, lineTotalUsd: 4.00 },
    { name: 'Odd-Sized Items',  qty: 1, lineTotalUsd: 5.00 },
  ],
  days: 2,
  dropoffLocation: 'CMB Airport',
  pickupLocation: 'Hotel Thilon',
  dropoffSurcharge: 10.00,
  pickupSurcharge: 0.00,
  addonTotal: 5.00,
  baseTotal: 18.00,
  grandTotal: 33.00,
  requiresStripe: true,
};

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;

  const booking = DEMO_BOOKING;

  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash'>(
    booking.requiresStripe ? 'stripe' : 'cash',
  );
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvv, setCvv]               = useState('');
  const [loading, setLoading]       = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    router.push(`/booking/${bookingId}/confirmation`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <NavBar />

      <main className="max-w-6xl mx-auto py-12 px-6" id="checkout-main">
        {/* Header */}
        <div className="mb-8">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 mb-3 inline-block">Final Step</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Complete your booking</h1>
          <p className="text-base text-slate-600 mt-2 font-medium">
            Review your reservation details and select a payment method.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left: payment form */}
          <div className="lg:col-span-3 flex flex-col gap-6">

            {/* Payment method */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-2xs">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Payment Method</h2>

              {booking.requiresStripe && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 mb-6" role="alert" id="stripe-required-notice">
                  <Lock className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-700" />
                  <div>
                    <p className="text-sm font-bold text-amber-950">Card payment required</p>
                    <p className="text-xs font-medium text-amber-800">CMB Airport bookings require card payment.</p>
                  </div>
                </div>
              )}

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

                {/* Cash */}
                <label
                  className={[
                    'flex items-center gap-4 p-5 rounded-2xl border-2 transition-all',
                    booking.requiresStripe
                      ? 'cursor-not-allowed opacity-40 border-slate-200 bg-slate-50'
                      : 'cursor-pointer border-slate-200 hover:border-slate-300',
                    paymentMethod === 'cash' ? 'border-orange-600 bg-orange-50/50' : '',
                  ].join(' ')}
                  id="payment-cash-label"
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => !booking.requiresStripe && setPaymentMethod('cash')}
                    disabled={booking.requiresStripe}
                    className="accent-orange-600 w-4 h-4 cursor-pointer"
                    id="payment-cash"
                  />
                  <Banknote className="w-6 h-6 text-slate-700 flex-shrink-0" />
                  <div>
                    <p className="text-base font-bold text-slate-900">Cash on Drop-off</p>
                    <p className="text-xs font-medium text-slate-500">
                      {booking.requiresStripe ? 'Not available for CMB Airport bookings' : 'Pay in cash when leaving your items'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Card details (simulated) */}
            {paymentMethod === 'stripe' && (
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-2xs">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Card Details</h2>
                <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-xs font-semibold text-emerald-900">
                    <strong>Demo Simulation</strong> — enter any 16-digit card number.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="card-number" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Card Number</label>
                    <input
                      id="card-number"
                      type="text"
                      inputMode="numeric"
                      maxLength={19}
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                      placeholder="4242 4242 4242 4242"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-600 focus:bg-white focus:ring-2 focus:ring-orange-600/20 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="card-expiry" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Expiry</label>
                      <input id="card-expiry" type="text" maxLength={5} value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-600 focus:bg-white focus:ring-2 focus:ring-orange-600/20 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="card-cvv" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">CVV</label>
                      <input id="card-cvv" type="text" maxLength={4} value={cvv} onChange={e => setCvv(e.target.value)} placeholder="123"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-600 focus:bg-white focus:ring-2 focus:ring-orange-600/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
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
              {loading ? 'Processing...' : `Confirm & Pay — ${formatUSD(booking.grandTotal)}`}
            </Button>
            <p className="text-xs text-center text-slate-500 font-medium">
              Protected by 256-bit bank level encryption
            </p>
          </div>

          {/* Right: order summary */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-lg">
              <h2 className="text-xl font-black text-slate-900 mb-6">Order Summary</h2>

              <div className="flex flex-col gap-3 mb-6">
                {booking.items.map(item => (
                  <div key={item.name} className="flex justify-between items-center py-1">
                    <span className="text-sm font-bold text-slate-900">
                      {item.qty}× {item.name}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{formatUSD(item.lineTotalUsd)}</span>
                  </div>
                ))}
                {booking.dropoffSurcharge > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span>Drop-off surcharge</span>
                    <span className="font-bold text-slate-900">+{formatUSD(booking.dropoffSurcharge)}</span>
                  </div>
                )}
                {booking.addonTotal > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span>Airport Service</span>
                    <span className="font-bold text-slate-900">+{formatUSD(booking.addonTotal)}</span>
                  </div>
                )}
                <div className="border-t-2 border-slate-900 my-2" />
                <div className="flex justify-between items-start pt-1">
                  <span className="text-base font-black text-slate-900">Grand Total</span>
                  <div className="text-right">
                    <p className="text-3xl font-black text-orange-600">{formatUSD(booking.grandTotal)}</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{formatLKR(booking.grandTotal)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Box className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Drop-off Location</p>
                    <p className="text-sm font-bold text-slate-900">{booking.dropoffLocation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Pick-up Location</p>
                    <p className="text-sm font-bold text-slate-900">{booking.pickupLocation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Duration</p>
                    <p className="text-sm font-bold text-slate-900">
                      {booking.days} day(s) storage
                    </p>
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
