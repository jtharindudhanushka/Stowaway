'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { NavBar } from '@/components/ui/NavBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PillTag } from '@/components/ui/PillTag';
import { formatUSD } from '@/lib/currency';

type BookingStatus = 'confirmed' | 'in_transit' | 'deposited' | 'picked_up' | 'cancelled';
type TabType = 'drop-offs' | 'pickups' | 'storage';

const STATUS_ACTIONS: Record<BookingStatus, { label: string; next: BookingStatus | null }> = {
  confirmed:  { label: 'Mark In-Transit', next: 'in_transit' },
  in_transit: { label: 'Mark Deposited',  next: 'deposited'  },
  deposited:  { label: 'Mark Picked Up',  next: 'picked_up'  },
  picked_up:  { label: 'Completed',       next: null          },
  cancelled:  { label: 'Cancelled',       next: null          },
};

const STATUS_PILL: Record<BookingStatus, 'mint' | 'shade'> = {
  confirmed:  'mint',
  in_transit: 'shade',
  deposited:  'mint',
  picked_up:  'shade',
  cancelled:  'shade',
};

const DEMO_BOOKINGS = [
  {
    id: 'bk-001', customer: '+94 71 234 5678',
    dropoff: 'CMB Airport', pickup: 'Hotel Thilon',
    items: '2× Carry-On, 1× Odd-Sized',
    grandTotal: 33.00, status: 'confirmed' as BookingStatus,
    storageEnd: '2026-07-28', type: 'drop-offs',
    airportPickup: true,
  },
  {
    id: 'bk-002', customer: '+94 77 987 6543',
    dropoff: 'Hotel Thilon', pickup: 'Hotel Thilon',
    items: '1× Large Suitcase',
    grandTotal: 7.00, status: 'deposited' as BookingStatus,
    storageEnd: '2026-07-27', type: 'storage',
    airportPickup: false,
  },
  {
    id: 'bk-003', customer: '+94 76 111 2222',
    dropoff: 'CMB Airport', pickup: 'CMB Airport',
    items: '3× Carry-On',
    grandTotal: 26.00, status: 'in_transit' as BookingStatus,
    storageEnd: '2026-07-26', type: 'pickups',
    airportPickup: true,
  },
];

export default function StaffDashboard() {
  const [tab, setTab]         = useState<TabType>('drop-offs');
  const [bookings, setBookings] = useState(DEMO_BOOKINGS);

  const filtered = bookings.filter(b => b.type === tab);

  const handleTransition = (bookingId: string, nextStatus: BookingStatus | null) => {
    if (!nextStatus) return;
    setBookings(prev =>
      prev.map(b => b.id === bookingId ? { ...b, status: nextStatus } : b),
    );
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'drop-offs', label: 'Drop-offs', icon: '📦' },
    { id: 'pickups',   label: 'Airport Pickups', icon: '✈️' },
    { id: 'storage',   label: 'Storage Pick-ups', icon: '🚀' },
  ];

  return (
    <div className="min-h-screen canvas-cream">
      <NavBar variant="light" showStaffLogin={false} />

      <main className="container-content py-8 px-4" id="staff-dashboard-main">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <PillTag variant="shade" className="mb-2">Operations Dashboard</PillTag>
            <h1 className="text-display-md text-black">Upcoming Bookings</h1>
            <p className="text-body-md text-[#52525b] mt-1">Rolling 48-hour window</p>
          </div>
          <Link href="/login">
            <Button variant="outline-light" size="sm" id="staff-logout-btn">Sign Out</Button>
          </Link>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 p-1 bg-[#f4f4f5] rounded-full w-fit mb-6 overflow-x-auto"
          role="tablist"
          aria-label="Booking categories"
        >
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              id={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={[
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-caption font-[500] transition-all whitespace-nowrap',
                tab === t.id ? 'bg-black text-white shadow-sm' : 'text-[#52525b] hover:text-black',
              ].join(' ')}
            >
              {t.icon} {t.label}
              <span className={[
                'ml-1 px-1.5 py-0.5 rounded-full text-micro',
                tab === t.id ? 'bg-white/20 text-white' : 'bg-[#e4e4e7] text-[#52525b]',
              ].join(' ')}>
                {bookings.filter(b => b.type === t.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Booking cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl block mb-3">✅</span>
            <p className="text-heading-md text-black">All clear!</p>
            <p className="text-body-md text-[#52525b] mt-1">No bookings in this category for the next 48 hours.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(booking => {
              const action = STATUS_ACTIONS[booking.status];
              return (
                <Card key={booking.id} variant="pricing" className="flex flex-col gap-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-micro text-[#71717a] font-mono">#{booking.id}</p>
                      <p className="text-body-strong font-[550] text-black mt-0.5">{booking.customer}</p>
                    </div>
                    <PillTag variant={STATUS_PILL[booking.status]}>
                      {booking.status.replace('_', ' ')}
                    </PillTag>
                  </div>

                  {/* Route */}
                  <div className="bg-[#fbfbf5] rounded-lg p-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📦</span>
                      <p className="text-caption text-black"><strong>Drop-off:</strong> {booking.dropoff}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🚀</span>
                      <p className="text-caption text-black"><strong>Pick-up:</strong> {booking.pickup}</p>
                    </div>
                  </div>

                  {/* Items & addons */}
                  <div>
                    <p className="text-caption text-black">{booking.items}</p>
                    {booking.airportPickup && (
                      <PillTag variant="mint" className="mt-1.5">✈️ Airport Pickup</PillTag>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#e4e4e7]">
                    <div>
                      <p className="text-micro text-[#71717a]">End: {booking.storageEnd}</p>
                      <p className="text-caption font-[550] text-black">{formatUSD(booking.grandTotal)}</p>
                    </div>
                    {action.next && (
                      <Button
                        variant="primary"
                        size="sm"
                        id={`transition-${booking.id}`}
                        onClick={() => handleTransition(booking.id, action.next)}
                      >
                        {action.label}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
