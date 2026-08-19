'use client';

import React from 'react';
import Image from 'next/image';
import { formatUSD } from '@/lib/currency';
import { Plus, Minus } from 'lucide-react';

export interface ItemTier {
  id: string;
  code: string;
  name: string;
  description: string;
  supported_items: string;
  weight_spec: string | null;
  icon_emoji: string;
  image_url?: string | null;
  rate_daily_usd: number;
  /** Per-day rate applied to ALL days when booking exceeds 7 days */
  rate_weekly_usd: number;
  /** Flat per-item insurance fee when customer opts in */
  insurance_fee_usd: number;
}

interface ItemSelectorProps {
  tiers: ItemTier[];
  quantities: Record<string, number>;
  onQuantityChange: (tierId: string, delta: number) => void;
}

const imageMap: Record<string, { src: string; alt: string }> = {
  ITEM_001: { src: '/items/small_bag.png',      alt: 'Small bag / laptop' },
  ITEM_002: { src: '/items/carry_on.png',       alt: 'Medium / large bag' },
  ITEM_003: { src: '/items/large_suitcase.png', alt: 'XL suitcase' },
  ITEM_004: { src: '/items/odd_size.png',       alt: 'Odd-sized items' },
  ITEM_005: { src: '/items/tea_chest.png',      alt: 'Tea chest box' },
};

export function ItemSelector({ tiers, quantities, onQuantityChange }: ItemSelectorProps) {
  return (
    <div className="flex flex-col gap-4" id="item-selector">
      {tiers.map((tier) => {
        const qty      = quantities[tier.id] ?? 0;
        const config   = imageMap[tier.code] || { src: '/items/small_bag.png', alt: tier.name };
        const imageSrc = tier.image_url || config.src;

        return (
          <div
            key={tier.id}
            className={[
              'flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl transition-all duration-200 border',
              qty > 0
                ? 'bg-white border-orange-600 shadow-xs ring-2 ring-orange-600/20'
                : 'bg-white border-slate-200 hover:border-slate-300',
            ].join(' ')}
            id={`item-card-${tier.code}`}
          >
            {/* Left: Product Image & Info */}
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0 p-1 bg-slate-50 rounded-xl border border-slate-100">
                <Image
                  src={imageSrc}
                  alt={config.alt || tier.name}
                  width={80}
                  height={80}
                  className="object-contain max-h-16 max-w-16 sm:max-h-20 sm:max-w-20 hover:scale-105 transition-transform"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-base sm:text-lg font-extrabold text-[#1C130E] tracking-tight leading-snug">
                  {tier.name}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-snug font-medium">
                  {tier.description || tier.supported_items}
                </p>
                {tier.weight_spec && (
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{tier.weight_spec}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                  <p className="text-xs sm:text-sm font-black text-orange-600 flex items-center gap-1">
                    <span>{formatUSD(tier.rate_daily_usd)}</span>
                    <span className="text-slate-500 font-medium text-[11px]">/ day</span>
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {formatUSD(tier.rate_weekly_usd)}/day after 7 days
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Quantity Stepper */}
            <div
              className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100"
              role="group"
              aria-label={`Quantity for ${tier.name}`}
            >
              <span className="sm:hidden text-xs font-bold text-slate-400">Select Quantity</span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onQuantityChange(tier.id, -1)}
                  disabled={qty === 0}
                  id={`decrement-${tier.code}`}
                  aria-label={`Remove ${tier.name}`}
                  className={[
                    'w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer select-none',
                    qty === 0
                      ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100 active:bg-slate-200 shadow-2xs',
                  ].join(' ')}
                >
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                </button>

                <span
                  className="w-6 text-center text-base font-extrabold text-slate-900 tabular-nums"
                  aria-live="polite"
                  aria-label={`${qty} ${tier.name}`}
                >
                  {qty}
                </span>

                <button
                  type="button"
                  onClick={() => onQuantityChange(tier.id, +1)}
                  id={`increment-${tier.code}`}
                  aria-label={`Add ${tier.name}`}
                  className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center transition-all cursor-pointer select-none shadow-2xs"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
