'use client';

import React from 'react';
import { formatUSD, formatLKR } from '@/lib/currency';
import { Button } from '@/components/ui/Button';
import { Lock, ShieldCheck, CheckCircle } from 'lucide-react';
import type { ItemTier } from './ItemSelector';
import type { Location } from './LocationSelector';

interface PriceSummaryPanelProps {
  tiers: ItemTier[];
  quantities: Record<string, number>;
  dropoffTime: string;
  pickupTime: string;
  dropoffLocation: Location | null;
  pickupLocation: Location | null;
  airportPickupEnabled: boolean;
  airportPickupFee: number;
  onBookNow: () => void;
  isLoading?: boolean;
}

function calculateDays(dropoffISO: string, pickupISO: string): number {
  if (!dropoffISO || !pickupISO) return 0;
  const t1 = new Date(dropoffISO).getTime();
  const t2 = new Date(pickupISO).getTime();
  if (t2 <= t1) return 0;
  
  const diffMs = t2 - t1;
  const hours = diffMs / (1000 * 60 * 60);
  return Math.ceil(hours / 24); // 24 hour blocks
}

export function PriceSummaryPanel({
  tiers,
  quantities,
  dropoffTime,
  pickupTime,
  dropoffLocation,
  pickupLocation,
  airportPickupEnabled,
  airportPickupFee,
  onBookNow,
  isLoading = false,
}: PriceSummaryPanelProps) {
  const days = calculateDays(dropoffTime, pickupTime);
  
  // Calculate base storage
  const selectedTiers = tiers.filter(t => (quantities[t.id] ?? 0) > 0);
  const baseTotal = selectedTiers.reduce(
    (sum, t) => sum + (t.rate_daily_usd * (quantities[t.id] ?? 0) * days),
    0,
  );

  const dropoffSurcharge = dropoffLocation?.dropoff_surcharge_usd ?? 0;
  const pickupSurcharge  = pickupLocation?.pickup_surcharge_usd ?? 0;
  const addonFee         = airportPickupEnabled ? airportPickupFee : 0;
  const grandTotal       = baseTotal + dropoffSurcharge + pickupSurcharge + addonFee;

  const hasItems = selectedTiers.length > 0;
  const hasLocations = dropoffLocation && pickupLocation;
  const hasValidTime = days > 0;
  const canBook = hasItems && hasLocations && hasValidTime;

  const durLabel = days === 1 ? '1 day' : `${days} days`;

  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-lg" id="price-summary-panel">
      <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center justify-between">
        <span>Booking Summary</span>
        <span className="text-xs font-bold px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full">Guaranteed</span>
      </h3>

      {!hasItems && (
        <div className="bg-stone-100 border border-stone-300 rounded-xl p-5 text-center mb-6">
          <ShieldCheck className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-900">Select your items to see exact total</p>
          <p className="text-xs text-slate-600 mt-1 font-medium">Includes $10,000 protection guarantee</p>
        </div>
      )}

      {hasItems && (
        <div className="flex flex-col gap-3 mb-6">
          {/* Item lines */}
          {selectedTiers.map(tier => {
            const qty = quantities[tier.id] ?? 0;
            const rate = tier.rate_daily_usd;
            const lineTotal = rate * qty * days;
            return (
              <div key={tier.id} className="flex justify-between items-start gap-2 py-1">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-900 block">
                    {qty}× {tier.name}
                  </span>
                  <span className="text-xs font-medium text-slate-600">{durLabel} storage</span>
                </div>
                <span className="text-sm font-bold text-slate-900 flex-shrink-0">
                  {formatUSD(lineTotal)}
                </span>
              </div>
            );
          })}

          {/* Surcharges */}
          {dropoffSurcharge > 0 && (
            <div className="flex justify-between text-xs font-semibold text-slate-700 pt-1">
              <span>Drop-off surcharge (CMB)</span>
              <span className="font-bold text-slate-900">+{formatUSD(dropoffSurcharge)}</span>
            </div>
          )}
          {pickupSurcharge > 0 && (
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Pick-up surcharge (CMB)</span>
              <span className="font-bold text-slate-900">+{formatUSD(pickupSurcharge)}</span>
            </div>
          )}
          {airportPickupEnabled && (
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Airport Delivery Service</span>
              <span className="font-bold text-slate-900">+{formatUSD(addonFee)}</span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t-2 border-slate-900 my-2" />

          {/* Grand total */}
          <div className="flex justify-between items-start pt-1">
            <span className="text-base font-extrabold text-slate-900">Total Price</span>
            <div className="text-right">
              <p className="text-3xl font-black text-orange-600">{formatUSD(grandTotal)}</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">{formatLKR(grandTotal)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment note */}
      {(dropoffLocation?.requires_stripe || pickupLocation?.requires_stripe) && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 mb-4 flex items-center gap-2 text-amber-950 text-xs font-bold">
          <Lock className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>Card payment required for CMB Airport location</span>
        </div>
      )}

      <Button
        variant="primary"
        fullWidth
        size="lg"
        onClick={onBookNow}
        disabled={!canBook}
        loading={isLoading}
        id="book-now-cta"
        className="w-full py-4 text-base font-black shadow-sm"
      >
        {canBook ? `Book Storage — ${formatUSD(grandTotal)}` : 'Complete details to continue'}
      </Button>

      <div className="flex items-center justify-center gap-1.5 mt-4 text-xs font-bold text-slate-700">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        <span>Free cancellation up to 2 hours before drop-off</span>
      </div>
    </div>
  );
}
