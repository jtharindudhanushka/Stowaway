'use client';

import React from 'react';
import { formatUSD, formatLKR } from '@/lib/currency';
import { Button } from '@/components/ui/Button';
import type { ItemTier, DurationType } from './ItemSelector';
import type { Location } from './LocationSelector';

interface PriceSummaryPanelProps {
  tiers: ItemTier[];
  quantities: Record<string, number>;
  durationType: DurationType;
  durationValue: number;
  dropoffLocation: Location | null;
  pickupLocation: Location | null;
  airportPickupEnabled: boolean;
  airportPickupFee: number;
  onBookNow: () => void;
  isLoading?: boolean;
}

function getRate(tier: ItemTier, durationType: DurationType) {
  if (durationType === 'daily')   return tier.rate_daily_usd;
  if (durationType === 'weekly')  return tier.rate_weekly_usd;
  return tier.rate_monthly_usd;
}

export function PriceSummaryPanel({
  tiers,
  quantities,
  durationType,
  durationValue,
  dropoffLocation,
  pickupLocation,
  airportPickupEnabled,
  airportPickupFee,
  onBookNow,
  isLoading = false,
}: PriceSummaryPanelProps) {
  // Calculate base storage
  const selectedTiers = tiers.filter(t => (quantities[t.id] ?? 0) > 0);
  const baseTotal = selectedTiers.reduce(
    (sum, t) => sum + getRate(t, durationType) * (quantities[t.id] ?? 0) * durationValue,
    0,
  );

  const dropoffSurcharge = dropoffLocation?.dropoff_surcharge_usd ?? 0;
  const pickupSurcharge  = pickupLocation?.pickup_surcharge_usd ?? 0;
  const addonFee         = airportPickupEnabled ? airportPickupFee : 0;
  const grandTotal       = baseTotal + dropoffSurcharge + pickupSurcharge + addonFee;

  const hasItems = selectedTiers.length > 0;
  const hasLocations = dropoffLocation && pickupLocation;
  const canBook = hasItems && hasLocations;

  const durLabel =
    durationType === 'daily'   ? (durationValue === 1 ? '1 day' : `${durationValue} days`) :
    durationType === 'weekly'  ? (durationValue === 1 ? '1 week' : `${durationValue} weeks`) :
    (durationValue === 1 ? '1 month' : `${durationValue} months`);

  return (
    <div
      className="bg-white rounded-2xl border border-[#e4e4e7] p-6 sticky top-20"
      style={{
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
      }}
      id="price-summary-panel"
    >
      <h3 className="text-heading-md font-[500] text-black mb-4">Booking Summary</h3>

      {!hasItems && (
        <p className="text-caption text-[#71717a] text-center py-4">
          Select items above to see your price
        </p>
      )}

      {hasItems && (
        <div className="flex flex-col gap-2 mb-4">
          {/* Item lines */}
          {selectedTiers.map(tier => {
            const qty = quantities[tier.id] ?? 0;
            const rate = getRate(tier, durationType);
            const lineTotal = rate * qty * durationValue;
            return (
              <div key={tier.id} className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-caption text-black">
                    {tier.icon_emoji} {qty}× {tier.name}
                  </span>
                  <span className="text-micro text-[#71717a] block">{durLabel}</span>
                </div>
                <span className="text-caption font-[550] text-black flex-shrink-0">
                  {formatUSD(lineTotal)}
                </span>
              </div>
            );
          })}

          {/* Surcharges */}
          {dropoffSurcharge > 0 && (
            <div className="flex justify-between">
              <span className="text-caption text-[#52525b]">Drop-off surcharge (CMB)</span>
              <span className="text-caption font-[550] text-black">+{formatUSD(dropoffSurcharge)}</span>
            </div>
          )}
          {pickupSurcharge > 0 && (
            <div className="flex justify-between">
              <span className="text-caption text-[#52525b]">Pick-up surcharge (CMB)</span>
              <span className="text-caption font-[550] text-black">+{formatUSD(pickupSurcharge)}</span>
            </div>
          )}
          {airportPickupEnabled && (
            <div className="flex justify-between">
              <span className="text-caption text-[#52525b]">✈️ Airport Pickup/Delivery</span>
              <span className="text-caption font-[550] text-black">+{formatUSD(addonFee)}</span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-[#e4e4e7] my-1" />

          {/* Grand total */}
          <div className="flex justify-between items-start">
            <span className="text-body-strong font-[550] text-black">Total</span>
            <div className="text-right">
              <p className="text-heading-md font-[500] text-black">{formatUSD(grandTotal)}</p>
              <p className="text-caption text-[#71717a]">{formatLKR(grandTotal)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment note */}
      {(dropoffLocation?.requires_stripe || pickupLocation?.requires_stripe) && (
        <p className="text-micro text-[#71717a] mb-3 flex items-center gap-1">
          <span>🔒</span> Card payment required for CMB Airport bookings
        </p>
      )}

      <Button
        variant="aloe"
        fullWidth
        size="lg"
        onClick={onBookNow}
        disabled={!canBook}
        loading={isLoading}
        id="book-now-cta"
      >
        {canBook ? `Book Now — ${formatUSD(grandTotal)}` : 'Select items & locations'}
      </Button>

      <p className="text-micro text-center text-[#71717a] mt-3">
        No payment needed until confirmation
      </p>
    </div>
  );
}
