'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { formatUSD } from '@/lib/currency';
import { Phone, MessageSquare, QrCode, Calendar, MapPin, Box, ShieldCheck, Clock } from 'lucide-react';

const SUPPORT_PHONE = '+94 77 123 4567';
const WHATSAPP_LINK = 'https://wa.me/94771234567?text=Hello%20Stowaway%20Support';

// Demo bookings for logged-in user
const SAMPLE_MY_BOOKINGS = [
  {
    id: 'bk-8921a4',
    status: 'confirmed',
    dropoffLocation: 'CMB Airport',
    pickupLocation: 'Hotel Thilon, Colombo',
    dropoffTime: '2026-07-27 T 10:00 AM',
    pickupTime: '2026-07-29 T 02:00 PM',
    items: '2× Carry-On Luggage, 1× Odd-Sized Item',
    totalUsd: 33.00,
    qrCode: 'BK8921A4',
    notes: 'Flight UL 504 arrival',
  },
];

export default function MyBookingsPage() {
  const [phone, setPhone] = useState('');
  const [bookings, setBookings] = useState(SAMPLE_MY_BOOKINGS);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem('stowaway_customer_phone');
      if (savedPhone) {
        setPhone(savedPhone);
        fetch(`/api/bookings?phone=${encodeURIComponent(savedPhone)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.bookings && data.bookings.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const mapped = data.bookings.map((b: any) => ({
                id: b.id,
                status: b.status || 'confirmed',
                dropoffLocation: b.dropoffLocationId || 'Storage Hub',
                pickupLocation: b.pickupLocationId || 'Drop Point',
                dropoffTime: b.dropoffTime,
                pickupTime: b.pickupTime,
                items: b.items && b.items.length > 0 ? `${b.items.length} items` : 'Luggage Storage',
                totalUsd: b.grandTotalUsd,
                qrCode: b.id.toUpperCase(),
                notes: b.notes || '',
              }));
              setBookings(mapped);
            }
          })
          .catch(console.error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full" id="my-bookings-main">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-200">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 mb-2 inline-block">Customer Dashboard</span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1C130E] tracking-tight">My Storage Bookings</h1>
            {phone && (
              <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-orange-600" /> Account: {phone}
              </p>
            )}
          </div>

          {/* Quick Team Support Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <a href={`tel:${SUPPORT_PHONE}`} className="flex-1 md:flex-none">
              <Button variant="secondary" size="md" className="w-full flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-600" /> Call Team
              </Button>
            </a>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none">
              <Button variant="primary" size="md" className="w-full flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> WhatsApp Support
              </Button>
            </a>
          </div>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-md mx-auto shadow-2xs">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No active bookings found</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">You haven't placed any luggage storage bookings yet.</p>
            <Link href="/book">
              <Button variant="primary" size="lg" className="w-full">
                Book Storage Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col lg:flex-row justify-between gap-8 items-start">
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-100 text-emerald-800">
                      {b.status}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-bold">Ref: #{b.id}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-start gap-2.5">
                      <Box className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Drop-off</p>
                        <p className="text-sm font-bold text-slate-900">{b.dropoffLocation}</p>
                        <p className="text-xs text-slate-500 font-medium">{b.dropoffTime}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Pick-up</p>
                        <p className="text-sm font-bold text-slate-900">{b.pickupLocation}</p>
                        <p className="text-xs text-slate-500 font-medium">{b.pickupTime}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-orange-600" />
                    <span>{b.items}</span>
                  </div>

                  {b.notes && (
                    <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                      <strong>Note:</strong> {b.notes}
                    </p>
                  )}
                </div>

                {/* Right: QR Code & Price */}
                <div className="w-full lg:w-56 bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col items-center justify-between text-center gap-4">
                  <div>
                    <QrCode className="w-16 h-16 text-slate-900 mx-auto mb-1" />
                    <span className="text-xs font-mono font-bold text-slate-500">QR #{b.qrCode}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block uppercase">Total Paid</span>
                    <span className="text-2xl font-black text-orange-600">{formatUSD(b.totalUsd)}</span>
                  </div>
                  <Link href={`/booking/${b.id}/confirmation`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      View QR Pass
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
