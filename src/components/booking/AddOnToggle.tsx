'use client';

import React from 'react';
import { formatUSD } from '@/lib/currency';

interface AddOnToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  feeUsd: number;
}

export function AddOnToggle({ enabled, onChange, feeUsd }: AddOnToggleProps) {
  return (
    <button
      type="button"
      id="addon-airport-pickup"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={[
        'w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left',
        'transition-all duration-200 cursor-pointer',
        enabled
          ? 'border-black bg-[#d4f9e0]'
          : 'border-[#e4e4e7] bg-[#d4f9e0]/40 hover:border-black/30',
      ].join(' ')}
    >
      {/* Custom toggle visual */}
      <div className="flex-shrink-0 mt-0.5">
        <div
          className={[
            'w-10 h-6 rounded-full flex items-center transition-all duration-200 px-0.5',
            enabled ? 'bg-black justify-end' : 'bg-[#d4d4d8] justify-start',
          ].join(' ')}
        >
          <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xl" aria-hidden="true">✈️</span>
          <p className="text-body-strong font-[550] text-black">
            Airport Pickup / Delivery Service
          </p>
        </div>
        <p className="text-caption text-[#52525b] mt-1">
          We collect or deliver your luggage directly at the airport. Flat additional fee.
        </p>
        <p className="text-caption font-[550] text-black mt-1">
          +{formatUSD(feeUsd)} flat fee
        </p>
      </div>
    </button>
  );
}
