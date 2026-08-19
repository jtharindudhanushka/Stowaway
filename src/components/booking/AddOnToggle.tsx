'use client';

import React from 'react';
import { formatUSD, formatLKR } from '@/lib/currency';
import { Plane } from 'lucide-react';

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
        'w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer shadow-2xs',
        enabled
          ? 'border-orange-600 bg-orange-50/60 ring-2 ring-orange-600/20'
          : 'border-slate-200 bg-white hover:border-slate-300',
      ].join(' ')}
    >
      {/* Toggle Track & Knob */}
      <div className="flex-shrink-0 mt-1">
        <div
          className={[
            'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
            enabled ? 'bg-orange-600' : 'bg-slate-300',
          ].join(' ')}
        >
          <span
            className={[
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
              enabled ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-slate-900 mb-1">
          <Plane className="w-5 h-5 text-orange-600 flex-shrink-0" />
          <p className="text-base font-bold text-[#1C130E]">
            Airport Pickup / Delivery Service
          </p>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Direct pickup or delivery of your luggage at CMB Airport.
        </p>
        <p className="text-xs font-black text-orange-600 mt-2 flex items-center gap-1.5">
          <span>+{formatUSD(feeUsd)}</span>
          <span className="text-slate-500 font-medium text-[11px]">({formatLKR(feeUsd)}) service fee</span>
        </p>
      </div>
    </button>
  );
}
