'use client';

import React from 'react';
import { formatUSD, formatLKR } from '@/lib/currency';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import type { ItemTier } from './ItemSelector';

interface InsuranceToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  tiers: ItemTier[];
  quantities: Record<string, number>;
}

export function InsuranceToggle({ enabled, onChange, tiers, quantities }: InsuranceToggleProps) {
  // Build per-item breakdown
  const selectedWithInsurance = tiers
    .filter((t) => (quantities[t.id] ?? 0) > 0 && t.insurance_fee_usd > 0)
    .map((t) => ({
      name: t.name,
      qty:  quantities[t.id] ?? 0,
      fee:  t.insurance_fee_usd,
      lineTotal: (quantities[t.id] ?? 0) * t.insurance_fee_usd,
    }));

  const totalInsuranceFee = selectedWithInsurance.reduce((s, r) => s + r.lineTotal, 0);
  const hasItems = selectedWithInsurance.length > 0;

  return (
    <button
      type="button"
      id="insurance-toggle"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      disabled={!hasItems}
      className={[
        'w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer',
        enabled
          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
          : 'border-slate-200 bg-white hover:border-slate-300',
        !hasItems ? 'opacity-50 cursor-not-allowed' : '',
      ].join(' ')}
    >
      {/* Toggle Track */}
      <div className="flex-shrink-0 mt-1">
        <div
          className={[
            'w-11 h-6 rounded-full transition-colors duration-200 p-0.5 flex items-center',
            enabled ? 'bg-emerald-600' : 'bg-slate-300',
          ].join(' ')}
        >
          <div
            className={[
              'w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200',
              enabled ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {enabled
            ? <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            : <ShieldOff   className="w-5 h-5 text-slate-400 flex-shrink-0" />
          }
          <p className="text-base font-bold text-[#1C130E]">Insurance Add-on</p>
        </div>

        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
          Protect your stored items against loss or damage with comprehensive insurance. Fee is charged per item.
        </p>

        {/* Per-item breakdown */}
        {hasItems && (
          <div className="flex flex-col gap-1 mb-2">
            {selectedWithInsurance.map((row) => (
              <div key={row.name} className="flex justify-between text-xs font-semibold text-slate-600">
                <span>{row.qty}× {row.name}</span>
                <span className="text-emerald-700 font-bold">+{formatUSD(row.lineTotal)}</span>
              </div>
            ))}
          </div>
        )}

        {hasItems ? (
          <p className="text-sm font-black text-emerald-700 flex items-center gap-1.5">
            <span>Total: +{formatUSD(totalInsuranceFee)}</span>
            <span className="text-slate-400 font-medium text-xs">({formatLKR(totalInsuranceFee)})</span>
          </p>
        ) : (
          <p className="text-xs text-slate-400 font-medium">Select items above to see insurance cost.</p>
        )}
      </div>
    </button>
  );
}
