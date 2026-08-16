'use client';

import React from 'react';
import { formatUSD } from '@/lib/currency';
import { Lock, MapPin } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export interface Location {
  id: string;
  code: string;
  name: string;
  is_airport: boolean;
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

  const anyAirport = (dropoff?.is_airport || pickup?.is_airport) ?? false;

  const selectOptions = locations.map(l => ({
    value: l.id,
    label: l.name,
  }));

  return (
    <div className="flex flex-col gap-6" id="location-selector">
      {/* Drop-off */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
        <label
          htmlFor="dropoff-location"
          className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3"
        >
          <MapPin className="w-5 h-5 text-orange-600" />
          Drop-off Location
        </label>
        <CustomSelect
          options={selectOptions}
          value={dropoffId ?? ''}
          onChange={onDropoffChange}
          placeholder="Select drop-off location…"
          icon={<MapPin className="w-5 h-5 text-orange-600" />}
        />
        {dropoff && dropoff.dropoff_surcharge_usd > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">Fee</span>
            <span className="text-xs font-semibold text-slate-600">
              +{formatUSD(dropoff.dropoff_surcharge_usd)} drop-off surcharge
            </span>
          </div>
        )}
      </div>

      {/* Pick-up */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
        <label
          htmlFor="pickup-location"
          className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3"
        >
          <MapPin className="w-5 h-5 text-orange-600" />
          Pick-up Location
        </label>
        <CustomSelect
          options={selectOptions}
          value={pickupId ?? ''}
          onChange={onPickupChange}
          placeholder="Select pick-up location…"
          icon={<MapPin className="w-5 h-5 text-orange-600" />}
        />
        {pickup && pickup.pickup_surcharge_usd > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">Fee</span>
            <span className="text-xs font-semibold text-slate-600">
              +{formatUSD(pickup.pickup_surcharge_usd)} pick-up surcharge
            </span>
          </div>
        )}
      </div>

      {/* CMB Airport payment warning */}
      {anyAirport && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950"
          role="alert"
          id="airport-payment-notice"
        >
          <Lock className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-950">Card payment required</p>
            <p className="text-xs font-medium text-amber-800 mt-0.5">
              Airport bookings require secure card payment. Cash is not available.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
