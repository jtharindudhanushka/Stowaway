'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { formatUSD } from '@/lib/currency';
import { Box, Plane, Store, CheckCircle2, MapPin } from 'lucide-react';

type BookingStatus = 'confirmed' | 'in_transit' | 'deposited' | 'picked_up' | 'cancelled';
type TabType = 'drop-offs' | 'pickups' | 'storage';

const STATUS_ACTIONS: Record<BookingStatus, { label: string; next: BookingStatus | null }> = {
  confirmed:  { label: 'Mark In-Transit', next: 'in_transit' },
  in_transit: { label: 'Mark Deposited',  next: 'deposited'  },
  deposited:  { label: 'Mark Picked Up',  next: 'picked_up'  },
  picked_up:  { label: 'Completed',       next: null          },
  cancelled:  { label: 'Cancelled',       next: null          },
};

const DEMO_BOOKINGS = [
  {
    id: 'bk-001', customer: '+94 71 234 5678',
    dropoff: 'CMB Airport', pickup: 'Hotel Thilon',
    items: '2× Carry-On Luggage, 1× Odd-Sized Item',
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
    items: '3× Carry-On Luggage',
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

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'drop-offs', label: 'Drop-offs', icon: <Box className="w-4 h-4" /> },
    { id: 'pickups',   label: 'Airport Pickups', icon: <Plane className="w-4 h-4" /> },
    { id: 'storage',   label: 'Storage Pick-ups', icon: <Store className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <NavBar showStaffLogin={false} />

      <main className="max-w-6xl mx-auto py-10 px-6" id="staff-dashboard-main">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 mb-2 inline-block">Operations Dashboard</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Upcoming Bookings</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Rolling 48-hour operational window</p>
          </div>
          <Link href="/login">
            <Button variant="secondary" size="sm" id="staff-logout-btn">Sign Out</Button>
          </Link>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-full w-fit mb-8 overflow-x-auto shadow-2xs"
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
                'flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                tab === t.id ? 'bg-[#1C130E] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              {t.icon} {t.label}
              <span className={[
                'ml-1 px-2 py-0.5 rounded-full text-xs font-bold',
                tab === t.id ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-700',
              ].join(' ')}>
                {bookings.filter(b => b.type === t.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Booking cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mb-4" />
            <p className="text-xl font-bold text-slate-900">All clear!</p>
            <p className="text-sm text-slate-500 mt-1">No bookings in this category for the next 48 hours.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(booking => {
              const action = STATUS_ACTIONS[booking.status];
              return (
                <div key={booking.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col gap-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-mono text-slate-400">#{booking.id}</span>
                      <p className="text-base font-bold text-slate-900 mt-0.5">{booking.customer}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200 capitalize">
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-2.5 border border-slate-100">
                    <div className="flex items-center gap-2 text-xs">
                      <Box className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <p className="text-slate-900 font-semibold"><strong className="text-slate-500">Drop-off:</strong> {booking.dropoff}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <p className="text-slate-900 font-semibold"><strong className="text-slate-500">Pick-up:</strong> {booking.pickup}</p>
                    </div>
                  </div>

                  {/* Items & addons */}
                  <div>
                    <p className="text-sm font-bold text-slate-900">{booking.items}</p>
                    {booking.airportPickup && (
                      <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Plane className="w-3.5 h-3.5" /> Airport Pickup Service
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs font-medium text-slate-400">End: {booking.storageEnd}</p>
                      <p className="text-base font-extrabold text-slate-900">{formatUSD(booking.grandTotal)}</p>
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
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
