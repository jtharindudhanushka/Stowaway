'use client';

import React, { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { formatLKR } from '@/lib/currency';
import { QrCode, CheckCircle2, Box, Store, MapPin } from 'lucide-react';

export default function ConfirmationPage() {
  const params   = useParams();
  const bookingId = params.id as string;
  const qrRef     = useRef<HTMLCanvasElement>(null);

  const bookingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/booking/${bookingId}`
    : `/booking/${bookingId}`;

  useEffect(() => {
    if (qrRef.current) {
      QRCode.toCanvas(qrRef.current, bookingUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#1C130E', light: '#ffffff' },
      });
    }
  }, [bookingUrl]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <NavBar />

      <main className="max-w-6xl mx-auto py-12 px-6" id="confirmation-main">
        {/* Success header */}
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-3">Booking Confirmed</span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900">You're all set!</h1>
          <p className="text-base text-slate-600 mt-2 max-w-sm mx-auto font-medium">
            Your luggage storage is confirmed. Show this QR code at drop-off.
          </p>
        </div>

        <div className="flex flex-col gap-8 max-w-2xl mx-auto">
          {/* QR Code card */}
          <div className="bg-white rounded-2xl p-8 border-2 border-slate-900 flex flex-col items-center shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wider mb-4 text-slate-700 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-orange-600" />
              Scan at drop-off location
            </p>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <canvas
                ref={qrRef}
                className="rounded-xl"
                style={{ imageRendering: 'pixelated' }}
                aria-label="Booking QR code"
                id="booking-qr-code"
              />
            </div>
            <p className="text-sm font-bold text-slate-600 mt-4 font-mono">
              #{bookingId?.slice(0, 8).toUpperCase() ?? 'DEMO0001'}
            </p>
          </div>

          {/* Booking summary */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-2xs">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Booking Details</h2>
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Status</p>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Confirmed</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Paid</p>
                  <p className="text-2xl font-black text-orange-600">$33.00</p>
                  <p className="text-xs font-semibold text-slate-500">{formatLKR(33)}</p>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Drop-off Location</p>
                  <p className="text-sm font-bold text-slate-900">CMB Airport</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Pick-up Location</p>
                  <p className="text-sm font-bold text-slate-900">Hotel Thilon</p>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-6">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Items Stored</p>
                <p className="text-sm font-bold text-slate-900">2× Carry-On Luggage, 1× Odd-Sized Item</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">for 2 days + Airport Service</p>
              </div>
            </div>
          </div>

          {/* What next */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-2xs">
            <h2 className="text-xl font-bold text-slate-900 mb-6">What happens next?</h2>
            <div className="flex flex-col gap-6">
              {[
                { step: '1', icon: <QrCode className="w-5 h-5 text-orange-600"/>, text: 'Show this QR code when you arrive at drop-off.' },
                { step: '2', icon: <Store className="w-5 h-5 text-orange-600"/>, text: 'Our staff checks in your items securely.' },
                { step: '3', icon: <Box className="w-5 h-5 text-orange-600"/>, text: 'Your items are safely stored in our insured facility.' },
                { step: '4', icon: <MapPin className="w-5 h-5 text-orange-600"/>, text: 'Pick up your items at your scheduled pick-up time.' },
              ].map(({ step, icon, text }) => (
                <div key={step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-800 flex-shrink-0 flex items-center justify-center text-sm font-bold">
                    {step}
                  </div>
                  <div className="flex gap-3 text-slate-900 mt-1">
                    <span className="flex-shrink-0">{icon}</span>
                    <p className="text-sm font-semibold text-slate-800 leading-relaxed">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-4">
            <Link href={`/booking/${bookingId}`}>
              <Button variant="secondary" fullWidth size="lg" id="view-booking-btn">
                View Booking Details
              </Button>
            </Link>
            <Link href="/">
              <Button variant="primary" fullWidth id="book-another-btn">
                Book Another Storage
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
