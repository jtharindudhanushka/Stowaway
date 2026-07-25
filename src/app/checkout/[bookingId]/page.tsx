'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PillTag } from '@/components/ui/PillTag';
import { formatUSD, formatLKR } from '@/lib/currency';

// Demo booking data — in production fetched from Supabase by bookingId
const DEMO_BOOKING = {
  id: 'demo',
  items: [
    { name: 'Carry-On Luggage', qty: 2, icon: '🧳', lineTotalUsd: 4.00 },
    { name: 'Odd-Sized Items',  qty: 1, icon: '🚲', lineTotalUsd: 5.00 },
  ],
  durationType: 'daily',
  durationValue: 2,
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

  // For demo purposes use static data
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
    // Simulate payment processing (2s)
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    router.push(`/booking/${bookingId}/confirmation`);
  };

  return (
    <div className="min-h-screen canvas-cream">
      <NavBar variant="light" />

      <main className="container-reading py-12 px-4" id="checkout-main">
        {/* Header */}
        <div className="mb-8">
          <PillTag variant="mint" className="mb-3">Step 2 of 2</PillTag>
          <h1 className="text-display-lg text-black">Complete your booking</h1>
          <p className="text-body-md text-[#52525b] mt-2">
            Review your order and choose a payment method.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left: payment form */}
          <div className="lg:col-span-3 flex flex-col gap-6">

            {/* Payment method */}
            <Card variant="pricing">
              <h2 className="text-heading-md font-[500] text-black mb-4">Payment Method</h2>

              {/* CMB lock notice */}
              {booking.requiresStripe && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-black/5 border border-black/10 mb-4" role="alert" id="stripe-required-notice">
                  <span className="text-lg">🔒</span>
                  <div>
                    <p className="text-caption font-[550] text-black">Card payment required</p>
                    <p className="text-micro text-[#52525b]">CMB Airport bookings require card payment.</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {/* Stripe */}
                <label
                  className={[
                    'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    paymentMethod === 'stripe' ? 'border-black bg-[#c1fbd4]' : 'border-[#e4e4e7] hover:border-black/30',
                  ].join(' ')}
                  id="payment-stripe-label"
                >
                  <input
                    type="radio"
                    name="payment"
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={() => setPaymentMethod('stripe')}
                    className="accent-black"
                    id="payment-stripe"
                  />
                  <span className="text-xl">💳</span>
                  <div>
                    <p className="text-body-strong font-[550] text-black">Card Payment (Stripe)</p>
                    <p className="text-micro text-[#52525b]">Secure, instant payment</p>
                  </div>
                  <PillTag variant="mint" className="ml-auto">Recommended</PillTag>
                </label>

                {/* Cash */}
                <label
                  className={[
                    'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                    booking.requiresStripe
                      ? 'cursor-not-allowed opacity-40 border-[#e4e4e7]'
                      : 'cursor-pointer border-[#e4e4e7] hover:border-black/30',
                    paymentMethod === 'cash' ? 'border-black' : '',
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
                    className="accent-black"
                    id="payment-cash"
                  />
                  <span className="text-xl">💵</span>
                  <div>
                    <p className="text-body-strong font-[550] text-black">Cash on Drop-off</p>
                    <p className="text-micro text-[#52525b]">
                      {booking.requiresStripe ? 'Not available for CMB Airport bookings' : 'Pay when you drop off your items'}
                    </p>
                  </div>
                </label>
              </div>
            </Card>

            {/* Card details (simulated) */}
            {paymentMethod === 'stripe' && (
              <Card variant="pricing">
                <h2 className="text-heading-md font-[500] text-black mb-4">Card Details</h2>
                <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-[#d4f9e0]">
                  <span>🧪</span>
                  <p className="text-micro text-[#52525b]">
                    <strong>Demo mode</strong> — enter any values. No real charge will occur.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="card-number" className="block text-caption font-[500] text-[#52525b] mb-1.5 uppercase tracking-[0.72px]">Card Number</label>
                    <input
                      id="card-number"
                      type="text"
                      inputMode="numeric"
                      maxLength={19}
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                      placeholder="4242 4242 4242 4242"
                      className="w-full border border-[#e4e4e7] rounded-lg px-3 py-2.5 text-body-md text-black placeholder-[#a1a1aa] focus:border-black focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="card-expiry" className="block text-caption font-[500] text-[#52525b] mb-1.5 uppercase tracking-[0.72px]">Expiry</label>
                      <input id="card-expiry" type="text" maxLength={5} value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY"
                        className="w-full border border-[#e4e4e7] rounded-lg px-3 py-2.5 text-body-md text-black placeholder-[#a1a1aa] focus:border-black focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="card-cvv" className="block text-caption font-[500] text-[#52525b] mb-1.5 uppercase tracking-[0.72px]">CVV</label>
                      <input id="card-cvv" type="text" maxLength={4} value={cvv} onChange={e => setCvv(e.target.value)} placeholder="123"
                        className="w-full border border-[#e4e4e7] rounded-lg px-3 py-2.5 text-body-md text-black placeholder-[#a1a1aa] focus:border-black focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleConfirm}
              loading={loading}
              id="confirm-pay-btn"
            >
              {loading ? 'Processing…' : `Confirm & Pay — ${formatUSD(booking.grandTotal)}`}
            </Button>
            <p className="text-micro text-center text-[#71717a]">
              🔒 Secure checkout — demo simulation only
            </p>
          </div>

          {/* Right: order summary */}
          <div className="lg:col-span-2">
            <Card variant="pricing">
              <h2 className="text-heading-md font-[500] text-black mb-4">Order Summary</h2>

              <div className="flex flex-col gap-2.5 mb-4">
                {booking.items.map(item => (
                  <div key={item.name} className="flex justify-between items-center">
                    <span className="text-caption text-black">
                      {item.icon} {item.qty}× {item.name}
                    </span>
                    <span className="text-caption font-[550]">{formatUSD(item.lineTotalUsd)}</span>
                  </div>
                ))}
                {booking.dropoffSurcharge > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-caption text-[#52525b]">Drop-off surcharge</span>
                    <span className="text-caption font-[550]">+{formatUSD(booking.dropoffSurcharge)}</span>
                  </div>
                )}
                {booking.addonTotal > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-caption text-[#52525b]">✈️ Airport Pickup</span>
                    <span className="text-caption font-[550]">+{formatUSD(booking.addonTotal)}</span>
                  </div>
                )}
                <div className="border-t border-[#e4e4e7] my-1" />
                <div className="flex justify-between items-start">
                  <span className="text-body-strong font-[550]">Total</span>
                  <div className="text-right">
                    <p className="text-heading-md font-[500]">{formatUSD(booking.grandTotal)}</p>
                    <p className="text-caption text-[#71717a]">{formatLKR(booking.grandTotal)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#e4e4e7] pt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">📦</span>
                  <div>
                    <p className="text-micro text-[#52525b]">Drop-off</p>
                    <p className="text-caption font-[500]">{booking.dropoffLocation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">🚀</span>
                  <div>
                    <p className="text-micro text-[#52525b]">Pick-up</p>
                    <p className="text-caption font-[500]">{booking.pickupLocation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">📅</span>
                  <div>
                    <p className="text-micro text-[#52525b]">Duration</p>
                    <p className="text-caption font-[500]">
                      {booking.durationValue} {booking.durationType === 'daily' ? 'day(s)' : booking.durationType === 'weekly' ? 'week(s)' : 'month(s)'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
