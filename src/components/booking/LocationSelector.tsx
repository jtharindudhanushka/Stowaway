'use client';

import React from 'react';
import { formatUSD } from '@/lib/currency';
import { MapPin, Plane, ArrowRight, Check, CreditCard } from 'lucide-react';
import { isAirportLocation } from '@/lib/locations';

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
  pickupId: string | null;
  onDropoffChange: (id: string) => void;
  onPickupChange: (id: string) => void;
}

/**
 * Boarding-pass styled location picker.
 *
 * Replaces the two dropdowns. With a handful of locations, a dropdown hides
 * the one thing the customer is actually choosing between — and it hid the
 * surcharge until after selection. Laying the options out as cards puts the
 * airport flag and the fee on the face of each choice.
 *
 * The two halves are split by a perforation (dotted rule with notches) so
 * the drop-off → pick-up pairing reads as one ticket.
 */
export function LocationSelector({
  locations,
  dropoffId,
  pickupId,
  onDropoffChange,
  onPickupChange,
}: LocationSelectorProps) {
  const dropoff = locations.find((l) => l.id === dropoffId);
  const pickup = locations.find((l) => l.id === pickupId);
  const cardOnly = isAirportLocation(dropoff) || isAirportLocation(pickup);

  return (
    <div className="flex flex-col gap-4" id="location-selector">
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Ticket header */}
        <div className="bg-[#1C130E] px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-[0.15em]">
              Storage Pass
            </span>
          </div>
          {dropoff && pickup && (
            <div className="flex items-center gap-1.5 text-white text-xs font-bold min-w-0">
              <span className="truncate max-w-[80px] sm:max-w-none">{dropoff.code}</span>
              <ArrowRight className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[80px] sm:max-w-none">{pickup.code}</span>
            </div>
          )}
        </div>

        <LegPicker
          legend="Drop-off Location"
          hint="Where you hand your bags over"
          locations={locations}
          selectedId={dropoffId}
          onSelect={onDropoffChange}
          surchargeOf={(l) => l.dropoff_surcharge_usd}
          namePrefix="dropoff"
        />

        {/* Perforation */}
        <div className="relative py-1" aria-hidden="true">
          <div
            className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
                       bg-slate-50 border border-slate-200"
          />
          <div
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
                       bg-slate-50 border border-slate-200"
          />
          <div className="mx-5 border-t-2 border-dashed border-slate-200" />
        </div>

        <LegPicker
          legend="Pick-up Location"
          hint="Where you collect them again"
          locations={locations}
          selectedId={pickupId}
          onSelect={onPickupChange}
          surchargeOf={(l) => l.pickup_surcharge_usd}
          namePrefix="pickup"
        />
      </div>

      {/*
        Airport bookings are card-only. This states the fact once, plainly.
        The cash option is removed from checkout entirely rather than shown
        disabled — an option you cannot pick is not information.
      */}
      {cardOnly && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200"
          id="airport-payment-notice"
        >
          <CreditCard className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden="true" />
          <p className="text-xs font-medium text-slate-600">
            Airport bookings are paid by card at checkout.
          </p>
        </div>
      )}
    </div>
  );
}

interface LegPickerProps {
  legend: string;
  hint: string;
  locations: Location[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  surchargeOf: (l: Location) => number;
  namePrefix: string;
}

function LegPicker({
  legend,
  hint,
  locations,
  selectedId,
  onSelect,
  surchargeOf,
  namePrefix,
}: LegPickerProps) {
  return (
    <fieldset className="px-5 py-5 border-0 m-0">
      <legend className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-0.5 p-0">
        <MapPin className="w-4 h-4 text-orange-600" aria-hidden="true" />
        {legend}
      </legend>
      <p className="text-xs font-medium text-slate-500 mb-3.5 ml-6">{hint}</p>

      {/*
        Single column on mobile, two across from sm up. Cards stay full-width
        targets so they remain comfortable to tap.
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {locations.map((loc) => {
          const selected = selectedId === loc.id;
          const surcharge = surchargeOf(loc);
          const airport = isAirportLocation(loc);
          const inputId = `${namePrefix}-${loc.id}`;

          return (
            <label
              key={loc.id}
              htmlFor={inputId}
              className={[
                'relative flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer',
                'transition-all duration-150 select-none',
                'focus-within:ring-2 focus-within:ring-orange-600/30 focus-within:ring-offset-1',
                selected
                  ? 'border-orange-600 bg-orange-50/70 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
              ].join(' ')}
            >
              <input
                type="radio"
                id={inputId}
                name={namePrefix}
                value={loc.id}
                checked={selected}
                onChange={() => onSelect(loc.id)}
                className="sr-only"
              />

              {/* Selection marker doubles as the location glyph */}
              <span
                className={[
                  'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                  selected ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-500',
                ].join(' ')}
                aria-hidden="true"
              >
                {selected ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : airport ? (
                  <Plane className="w-4 h-4" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-bold text-slate-900 leading-snug">{loc.name}</span>
                  {airport && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                 bg-[#1C130E] text-orange-400"
                    >
                      Airport
                    </span>
                  )}
                </span>

                <span className="block text-[11px] font-semibold text-slate-400 mt-0.5 font-mono">
                  {loc.code}
                </span>

                {surcharge > 0 && (
                  <span className="inline-block mt-1.5 text-xs font-bold text-orange-700">
                    +{formatUSD(surcharge)} location fee
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
