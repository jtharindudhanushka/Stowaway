'use client';

import React from 'react';
import { formatPrice } from '@/lib/currency';

/** Mirrors the item_tiers table row — populated from API or hardcoded for demo */
export interface ItemTier {
  id: string;
  code: string;
  name: string;
  description: string;
  supported_items: string;
  weight_spec: string | null;
  icon_emoji: string;
  rate_daily_usd: number;
  rate_weekly_usd: number;
  rate_monthly_usd: number;
}

export type DurationType = 'daily' | 'weekly' | 'monthly';

interface ItemSelectorProps {
  tiers: ItemTier[];
  quantities: Record<string, number>;
  durationType: DurationType;
  onQuantityChange: (tierId: string, delta: number) => void;
}

export function ItemSelector({
  tiers,
  quantities,
  durationType,
  onQuantityChange,
}: ItemSelectorProps) {
  return (
    <div className="flex flex-col gap-3" id="item-selector">
      {tiers.map((tier) => {
        const qty = quantities[tier.id] ?? 0;
        const rate =
          durationType === 'daily'   ? tier.rate_daily_usd :
          durationType === 'weekly'  ? tier.rate_weekly_usd :
          tier.rate_monthly_usd;

        const durLabel = durationType === 'daily' ? '/day' : durationType === 'weekly' ? '/week' : '/month';

        return (
          <div
            key={tier.id}
            className={[
              'flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200',
              qty > 0
                ? 'border-black bg-[#c1fbd4] shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
                : 'border-[#e4e4e7] bg-white hover:border-black/30 hover:shadow-sm',
            ].join(' ')}
            id={`item-card-${tier.code}`}
          >
            {/* Left: icon + info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-2xl flex-shrink-0 mt-0.5" aria-hidden="true">
                {tier.icon_emoji}
              </span>
              <div className="min-w-0">
                <p className="text-heading-sm font-[500] text-black truncate">
                  {tier.name}
                </p>
                <p className="text-caption text-[#52525b] mt-0.5 line-clamp-2">
                  {tier.supported_items}
                  {tier.weight_spec && (
                    <span className="ml-1 text-[#71717a]">· {tier.weight_spec}</span>
                  )}
                </p>
                <p className="text-caption font-[550] text-black mt-1">
                  {formatPrice(rate)}
                  <span className="text-[#71717a] font-[400]">{durLabel}</span>
                </p>
              </div>
            </div>

            {/* Right: counter */}
            <div
              className="flex items-center gap-2 flex-shrink-0"
              role="group"
              aria-label={`Quantity for ${tier.name}`}
            >
              <button
                onClick={() => onQuantityChange(tier.id, -1)}
                disabled={qty === 0}
                id={`decrement-${tier.code}`}
                aria-label={`Remove ${tier.name}`}
                className={[
                  'w-8 h-8 rounded-full border flex items-center justify-center',
                  'text-lg font-light transition-all duration-150',
                  qty === 0
                    ? 'border-[#d4d4d8] text-[#a1a1aa] cursor-not-allowed'
                    : 'border-black text-black hover:bg-black hover:text-white',
                ].join(' ')}
              >
                −
              </button>

              <span
                className="w-6 text-center text-body-strong font-[550] tabular-nums"
                aria-live="polite"
                aria-label={`${qty} ${tier.name}`}
              >
                {qty}
              </span>

              <button
                onClick={() => onQuantityChange(tier.id, +1)}
                id={`increment-${tier.code}`}
                aria-label={`Add ${tier.name}`}
                className="w-8 h-8 rounded-full border border-black text-black flex items-center justify-center text-lg font-light hover:bg-black hover:text-white transition-all duration-150"
              >
                +
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
