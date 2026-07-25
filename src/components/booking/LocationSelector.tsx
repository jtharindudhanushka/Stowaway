'use client';

import React from 'react';
import { formatUSD } from '@/lib/currency';
import { PillTag } from '@/components/ui/PillTag';

export interface Location {
  id: string;
  code: string;
  name: string;
  dropoff_surcharge_usd: number;
  pickup_surcharge_usd: number;
  requires_stripe: boolean;
  allows_cash: boolean;
}

interface LocationSelectorProps {
  locations: Location[];
  dropoffId: string | null;
  pickupId:  string | null;
  onDropoffChange: (id: string) => void;
  onPickupChange:  (id: string) => void;
}

export function LocationSelector({
  locations,
  dropoffId,
  pickupId,
  onDropoffChange,
  onPickupChange,
}: LocationSelectorProps) {
  const dropoff = locations.find(l => l.id === dropoffId);
  const pickup  = locations.find(l => l.id === pickupId);

  const anyAirport = (dropoff?.requires_stripe || pickup?.requires_stripe) ?? false;

  return (
    <div className="flex flex-col gap-4" id="location-selector">
      {/* Drop-off */}
      <div>
        <label
          htmlFor="dropoff-location"
          className="block text-caption font-[500] text-[#52525b] mb-1.5 uppercase tracking-[0.72px]"
        >
          Drop-off Location
        </label>
        <select
          id="dropoff-location"
          value={dropoffId ?? ''}
          onChange={e => onDropoffChange(e.target.value)}
          className="w-full rounded-lg border border-[#e4e4e7] bg-white text-black px-3 py-2.5 text-body-md appearance-none cursor-pointer hover:border-black/40 focus:border-black focus:outline-none transition-colors"
        >
          <option value="" disabled>Select drop-off location…</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        {dropoff && dropoff.dropoff_surcharge_usd > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <PillTag variant="shade">Surcharge</PillTag>
            <span className="text-caption text-[#52525b]">
              +{formatUSD(dropoff.dropoff_surcharge_usd)} drop-off fee
            </span>
          </div>
        )}
      </div>

      {/* Pick-up */}
      <div>
        <label
          htmlFor="pickup-location"
          className="block text-caption font-[500] text-[#52525b] mb-1.5 uppercase tracking-[0.72px]"
        >
          Pick-up Location
        </label>
        <select
          id="pickup-location"
          value={pickupId ?? ''}
          onChange={e => onPickupChange(e.target.value)}
          className="w-full rounded-lg border border-[#e4e4e7] bg-white text-black px-3 py-2.5 text-body-md appearance-none cursor-pointer hover:border-black/40 focus:border-black focus:outline-none transition-colors"
        >
          <option value="" disabled>Select pick-up location…</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        {pickup && pickup.pickup_surcharge_usd > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <PillTag variant="shade">Surcharge</PillTag>
            <span className="text-caption text-[#52525b]">
              +{formatUSD(pickup.pickup_surcharge_usd)} pick-up fee
            </span>
          </div>
        )}
      </div>

      {/* CMB Airport payment warning */}
      {anyAirport && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg bg-black/5 border border-black/10"
          role="alert"
          id="airport-payment-notice"
        >
          <span className="text-lg mt-0.5" aria-hidden="true">🔒</span>
          <div>
            <p className="text-caption font-[550] text-black">Card payment required</p>
            <p className="text-micro text-[#52525b] mt-0.5">
              CMB Airport bookings require Stripe card payment. Cash is not available.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
