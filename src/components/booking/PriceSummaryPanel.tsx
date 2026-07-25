'use client';

import React from 'react';
import { formatUSD, formatLKR } from '@/lib/currency';
import { MapPin, Calendar, Box, Plane, CheckCircle2, ShieldCheck } from 'lucide-react';
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
}

function calculateDays(dropoffISO: string, pickupISO: string): number {
  if (!dropoffISO || !pickupISO) return 0;
  const t1 = new Date(dropoffISO).getTime();
  const t2 = new Date(pickupISO).getTime();
  if (t2 <= t1) return 0;
  
  const diffMs = t2 - t1;
  const hours = diffMs / (1000 * 60 * 60);
  return Math.ceil(hours / 24);
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
}: PriceSummaryPanelProps) {
  const days = calculateDays(dropoffTime, pickupTime);
  const durLabel = days === 1 ? '1 day' : days > 1 ? `${days} days` : '';

  const selectedTiers = tiers.filter(t => (quantities[t.id] ?? 0) > 0);
  const baseTotal = selectedTiers.reduce(
    (sum, t) => sum + (t.rate_daily_usd * (quantities[t.id] ?? 0) * (days || 1)),
    0,
  );

  const dropoffSurcharge = dropoffLocation?.dropoff_surcharge_usd ?? 0;
  const pickupSurcharge  = pickupLocation?.pickup_surcharge_usd ?? 0;
  const addonFee         = airportPickupEnabled ? airportPickupFee : 0;
  const grandTotal       = baseTotal + dropoffSurcharge + pickupSurcharge + addonFee;

  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-[#1C130E] shadow-xl" id="price-summary-panel">
      <h3 className="text-xl font-black text-[#1C130E] mb-5">
        Booking Summary
      </h3>

      <div className="flex flex-col gap-4 text-xs font-semibold">
        {/* Selected Locations */}
        {dropoffLocation && (
          <div className="flex items-start gap-2.5 pb-3 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Drop-off Location</p>
              <p className="text-slate-900 font-bold truncate">{dropoffLocation.name}</p>
              {dropoffSurcharge > 0 && (
                <p className="text-orange-600 font-bold mt-0.5">+{formatUSD(dropoffSurcharge)} location surcharge</p>
              )}
            </div>
          </div>
        )}

        {pickupLocation && (
          <div className="flex items-start gap-2.5 pb-3 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Pick-up Location</p>
              <p className="text-slate-900 font-bold truncate">{pickupLocation.name}</p>
              {pickupSurcharge > 0 && (
                <p className="text-orange-600 font-bold mt-0.5">+{formatUSD(pickupSurcharge)} location surcharge</p>
              )}
            </div>
          </div>
        )}

        {/* Selected Dates & Duration */}
        {days > 0 && (
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600 flex-shrink-0" />
              <span className="text-slate-900 font-bold">Storage Duration</span>
            </div>
            <span className="px-2.5 py-1 bg-orange-100 text-orange-900 font-extrabold rounded-full">
              {durLabel}
            </span>
          </div>
        )}

        {/* Selected Items */}
        {selectedTiers.length > 0 && (
          <div className="flex flex-col gap-2 pb-3 border-b border-slate-100">
            <p className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-orange-600" /> Stored Items
            </p>
            {selectedTiers.map(tier => {
              const qty = quantities[tier.id] ?? 0;
              const lineTotal = tier.rate_daily_usd * qty * (days || 1);
              return (
                <div key={tier.id} className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">
                    {qty}× {tier.name}
                  </span>
                  <span className="font-extrabold text-slate-900">{formatUSD(lineTotal)}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Addon */}
        {airportPickupEnabled && (
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-orange-600" /> Airport Delivery Service
            </span>
            <span className="font-extrabold text-slate-900">+{formatUSD(airportPickupFee)}</span>
          </div>
        )}

        {/* Total Price */}
        <div className="pt-2">
          <div className="flex justify-between items-baseline">
            <span className="text-base font-black text-[#1C130E]">Total Price</span>
            <div className="text-right">
              <p className="text-3xl font-black text-orange-600">{formatUSD(grandTotal)}</p>
              <p className="text-xs font-bold text-slate-500 mt-0.5">{formatLKR(grandTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <span>Free cancellation up to 2 hours before drop-off</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <span>$10,000 insurance guarantee per booking</span>
        </div>
      </div>
    </div>
  );
}
