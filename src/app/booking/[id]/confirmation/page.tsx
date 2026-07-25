'use client';

import React, { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PillTag } from '@/components/ui/PillTag';
import { formatUSD, formatLKR } from '@/lib/currency';

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
        color: { dark: '#000000', light: '#d4f9e0' },
      });
    }
  }, [bookingUrl]);

  return (
    <div className="min-h-screen canvas-night text-white">
      <NavBar variant="dark" />

      <main className="container-reading py-16 px-4" id="confirmation-main">
        {/* Success header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <span className="text-6xl block mb-4" role="img" aria-label="Luggage">🛄</span>
          <PillTag variant="mint" className="mb-4">Booking Confirmed</PillTag>
          <h1 className="text-display-lg text-white">You&apos;re all set!</h1>
          <p className="text-body-lg text-white/60 mt-3 max-w-sm mx-auto">
            Your luggage storage is confirmed. Show the QR code at drop-off.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* QR Code card */}
          <Card variant="pistachio-band" className="flex flex-col items-center py-8">
            <p className="text-caption font-[550] text-[#52525b] uppercase tracking-[0.72px] mb-4">
              Scan at drop-off
            </p>
            <canvas
              ref={qrRef}
              className="rounded-xl"
              style={{ imageRendering: 'pixelated' }}
              aria-label="Booking QR code"
              id="booking-qr-code"
            />
            <p className="text-micro text-[#52525b] mt-3 font-mono">
              #{bookingId?.slice(0, 8).toUpperCase() ?? 'DEMO0001'}
            </p>
          </Card>

          {/* Booking summary */}
          <Card variant="cinematic">
            <h2 className="text-heading-md font-[500] text-white mb-5">Booking Details</h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-eyebrow text-white/40 mb-1">Status</p>
                  <PillTag variant="mint">Confirmed</PillTag>
                </div>
                <div>
                  <p className="text-eyebrow text-white/40 mb-1">Total Paid</p>
                  <p className="text-heading-md text-white">$33.00</p>
                  <p className="text-caption text-white/40">{formatLKR(33)}</p>
                </div>
              </div>
              <div className="border-t border-[#1e2c31] pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-eyebrow text-white/40 mb-1">Drop-off</p>
                  <p className="text-caption text-white">CMB Airport</p>
                </div>
                <div>
                  <p className="text-eyebrow text-white/40 mb-1">Pick-up</p>
                  <p className="text-caption text-white">Hotel Thilon</p>
                </div>
              </div>
              <div className="border-t border-[#1e2c31] pt-4">
                <p className="text-eyebrow text-white/40 mb-1">Items Stored</p>
                <p className="text-caption text-white">🧳 2× Carry-On, 🚲 1× Odd-Sized</p>
                <p className="text-caption text-white/60">for 2 days + ✈️ Airport Pickup</p>
              </div>
            </div>
          </Card>

          {/* What next */}
          <Card variant="cinematic">
            <h2 className="text-heading-md font-[500] text-white mb-4">What happens next?</h2>
            <div className="flex flex-col gap-4">
              {[
                { step: '1', icon: '📱', text: 'Show this QR code when you drop off your items at CMB Airport.' },
                { step: '2', icon: '🏪', text: 'Our team will check in your items and give you a receipt.' },
                { step: '3', icon: '📦', text: 'Your items are securely stored at our facility.' },
                { step: '4', icon: '🚀', text: 'Pick up your items at Hotel Thilon when you return.' },
              ].map(({ step, icon, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#c1fbd4] text-black flex-shrink-0 flex items-center justify-center text-micro font-[700]">
                    {step}
                  </div>
                  <div className="flex gap-2">
                    <span>{icon}</span>
                    <p className="text-caption text-white/70">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href={`/booking/${bookingId}`}>
              <Button variant="outline-dark" fullWidth size="lg" id="view-booking-btn">
                View Booking Details
              </Button>
            </Link>
            <Link href="/">
              <Button variant="aloe" fullWidth id="book-another-btn">
                Book Another Storage
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
