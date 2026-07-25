'use client';

import React from 'react';
import { formatUSD } from '@/lib/currency';
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
        'w-full flex items-start gap-[var(--space-lg)] p-[var(--space-2xl)] rounded-[var(--radius-xl)] border-2 text-left',
        'transition-all duration-200 cursor-pointer',
        enabled
          ? 'border-[var(--color-primary)] bg-[var(--color-canvas-soft)]'
          : 'border-[var(--color-surface-pressed)] bg-[var(--color-canvas)] hover:border-[var(--color-primary)]',
      ].join(' ')}
    >
      {/* Custom toggle visual */}
      <div className="flex-shrink-0 mt-1">
        <div
          className={[
            'w-10 h-6 rounded-[var(--radius-pill)] flex items-center transition-all duration-200 px-0.5',
            enabled ? 'bg-[var(--color-primary)] justify-end' : 'bg-[var(--color-surface-pressed)] justify-start',
          ].join(' ')}
        >
          <div className="w-5 h-5 rounded-[var(--radius-full)] bg-[var(--color-canvas)] shadow-[var(--shadow-3)]" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[var(--space-md)] flex-wrap text-[var(--color-ink)] mb-[var(--space-xs)]">
          <Plane className="w-5 h-5" />
          <p className="text-body-md-strong">
            Airport Pickup / Delivery Service
          </p>
        </div>
        <p className="text-body-sm text-[var(--color-body)]">
          We collect or deliver your luggage directly at the airport. Flat additional fee.
        </p>
        <p className="text-body-sm-strong text-[var(--color-ink)] mt-[var(--space-md)]">
          +{formatUSD(feeUsd)} flat fee
        </p>
      </div>
    </button>
  );
}
