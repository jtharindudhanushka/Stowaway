'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { NavBar } from '@/components/ui/NavBar';
import { Card } from '@/components/ui/Card';
import { PillTag } from '@/components/ui/PillTag';
import { Button } from '@/components/ui/Button';
import { formatUSD, formatLKR } from '@/lib/currency';

const STATUS_CONFIG = {
  confirmed:  { label: 'Confirmed',   color: 'mint'  as const, icon: '✅' },
  in_transit: { label: 'In Transit',  color: 'shade' as const, icon: '🚚' },
  deposited:  { label: 'Stored',      color: 'mint'  as const, icon: '📦' },
  picked_up:  { label: 'Picked Up',   color: 'shade' as const, icon: '🎉' },
  cancelled:  { label: 'Cancelled',   color: 'shade' as const, icon: '❌' },
};

// Demo booking — in production fetched from Supabase
const DEMO_BOOKING = {
  id: 'demo-booking-123',
  status: 'confirmed' as keyof typeof STATUS_CONFIG,
  customer: { phone: '+94 71 234 5678' },
  dropoffLocation: 'CMB Airport',
  pickupLocation: 'Hotel Thilon',
  storageStartDate: '2026-07-26',
  storageEndDate: '2026-07-28',
  durationValue: 2,
  durationType: 'daily',
  items: [
    { name: 'Carry-On Luggage', qty: 2, icon: '🧳', lineTotalUsd: 4.00 },
    { name: 'Odd-Sized Items',  qty: 1, icon: '🚲', lineTotalUsd: 10.00 },
  ],
  addons: [{ name: 'Airport Pickup/Delivery', fee: 5.00 }],
  dropoffSurcharge: 10.00,
  grandTotal: 33.00,
  paymentMethod: 'stripe_simulated',
  paymentStatus: 'paid',
  createdAt: '2026-07-25T19:00:00Z',
  qrCodeToken: 'demo-booking-123',
};

const TIMELINE = [
  { status: 'confirmed',  label: 'Booking Confirmed',    date: '25 Jul 2026', done: true },
  { status: 'in_transit', label: 'Luggage Collected',    date: '26 Jul 2026', done: false },
  { status: 'deposited',  label: 'Items Stored Securely',date: '26 Jul 2026', done: false },
  { status: 'picked_up',  label: 'Items Collected',      date: '28 Jul 2026', done: false },
];

export default function BookingDetailPage() {
  const params    = useParams();
  const bookingId = params.id as string;
  const booking   = DEMO_BOOKING; // TODO: fetch from Supabase

  const statusConf = STATUS_CONFIG[booking.status];

  return (
    <div className="min-h-screen canvas-cream">
      <NavBar variant="light" />

      <main className="container-reading py-12 px-4" id="booking-detail-main">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <PillTag variant={statusConf.color}>
              {statusConf.icon} {statusConf.label}
            </PillTag>
            <span className="text-caption text-[#71717a] font-mono">
              #{bookingId?.slice(0, 8).toUpperCase() ?? 'DEMO0001'}
            </span>
          </div>
          <h1 className="text-display-md text-black">Your Booking</h1>
          <p className="text-body-md text-[#52525b] mt-1">
            Track the status and details of your stored luggage.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Status timeline */}
          <Card variant="pricing">
            <h2 className="text-heading-md font-[500] text-black mb-5">Status Timeline</h2>
            <div className="flex flex-col gap-0">
              {TIMELINE.map(({ label, date, done }, idx) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={[
                      'w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center',
                      done ? 'bg-black border-black' : 'bg-white border-[#d4d4d8]',
                    ].join(' ')}>
                      {done && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    {idx < TIMELINE.length - 1 && (
                      <div className={`w-0.5 h-8 ${done ? 'bg-black' : 'bg-[#e4e4e7]'}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`text-caption font-[${done ? '550' : '420'}] ${done ? 'text-black' : 'text-[#a1a1aa]'}`}>
                      {label}
                    </p>
                    <p className="text-micro text-[#71717a]">{date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Items stored */}
          <Card variant="pricing">
            <h2 className="text-heading-md font-[500] text-black mb-4">Items Stored</h2>
            <div className="flex flex-col gap-3">
              {booking.items.map(item => (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    <div>
                      <p className="text-caption font-[550] text-black">{item.qty}× {item.name}</p>
                      <p className="text-micro text-[#71717a]">{booking.durationValue} {booking.durationType}(s)</p>
                    </div>
                  </div>
                  <span className="text-caption font-[550]">{formatUSD(item.lineTotalUsd)}</span>
                </div>
              ))}
              {booking.addons.map(a => (
                <div key={a.name} className="flex justify-between items-center">
                  <span className="text-caption text-[#52525b]">✈️ {a.name}</span>
                  <span className="text-caption font-[550]">+{formatUSD(a.fee)}</span>
                </div>
              ))}
              {booking.dropoffSurcharge > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-caption text-[#52525b]">Drop-off surcharge</span>
                  <span className="text-caption font-[550]">+{formatUSD(booking.dropoffSurcharge)}</span>
                </div>
              )}
              <div className="border-t border-[#e4e4e7] pt-3 flex justify-between">
                <span className="text-body-strong font-[550]">Total</span>
                <div className="text-right">
                  <p className="text-heading-md font-[500]">{formatUSD(booking.grandTotal)}</p>
                  <p className="text-caption text-[#71717a]">{formatLKR(booking.grandTotal)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Locations & dates */}
          <Card variant="pricing">
            <h2 className="text-heading-md font-[500] text-black mb-4">Locations & Dates</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-eyebrow text-[#71717a] mb-1">Drop-off</p>
                <p className="text-caption font-[550] text-black">📦 {booking.dropoffLocation}</p>
                <p className="text-micro text-[#71717a]">{booking.storageStartDate}</p>
              </div>
              <div>
                <p className="text-eyebrow text-[#71717a] mb-1">Pick-up</p>
                <p className="text-caption font-[550] text-black">🚀 {booking.pickupLocation}</p>
                <p className="text-micro text-[#71717a]">{booking.storageEndDate}</p>
              </div>
              <div>
                <p className="text-eyebrow text-[#71717a] mb-1">Payment</p>
                <p className="text-caption font-[550] text-black">
                  {booking.paymentMethod === 'stripe_simulated' ? '💳 Card (Simulated)' : '💵 Cash'}
                </p>
                <PillTag variant="mint" className="mt-1">
                  {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </PillTag>
              </div>
              <div>
                <p className="text-eyebrow text-[#71717a] mb-1">Booked</p>
                <p className="text-caption font-[550] text-black">
                  {new Date(booking.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href={`/booking/${bookingId}/confirmation`}>
              <Button variant="outline-light" fullWidth id="view-qr-btn">
                View QR Code
              </Button>
            </Link>
            <Link href="/">
              <Button variant="aloe" fullWidth id="book-another-detail-btn">
                Book Another Storage
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
