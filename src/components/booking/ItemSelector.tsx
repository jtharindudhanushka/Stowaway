'use client';

import React from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/currency';
import { Plus, Minus } from 'lucide-react';

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

interface ItemSelectorProps {
  tiers: ItemTier[];
  quantities: Record<string, number>;
  onQuantityChange: (tierId: string, delta: number) => void;
}

const imageMap: Record<string, { bg: string; src: string; alt: string }> = {
  ITEM_001: {
    bg: 'bg-orange-50',
    src: '/items/small_bag.png',
    alt: 'Small bag / purse',
  },
  ITEM_002: {
    bg: 'bg-emerald-50',
    src: '/items/carry_on.png',
    alt: 'Carry-on trolley suitcase',
  },
  ITEM_003: {
    bg: 'bg-amber-50',
    src: '/items/large_suitcase.png',
    alt: 'Large trunk suitcase',
  },
  ITEM_004: {
    bg: 'bg-purple-50',
    src: '/items/odd_size.png',
    alt: 'Bicycle and sports gear',
  },
  ITEM_005: {
    bg: 'bg-rose-50',
    src: '/items/tea_chest.png',
    alt: 'Tea chest storage box',
  },
};

export function ItemSelector({
  tiers,
  quantities,
  onQuantityChange,
}: ItemSelectorProps) {
  return (
    <div className="flex flex-col gap-4" id="item-selector">
      {tiers.map((tier) => {
        const qty = quantities[tier.id] ?? 0;
        const rate = tier.rate_daily_usd;
        const config = imageMap[tier.code] || {
          bg: 'bg-slate-100',
          src: '/items/small_bag.png',
          alt: tier.name,
        };

        return (
          <div
            key={tier.id}
            className={[
              'flex items-center justify-between gap-4 p-5 rounded-2xl transition-all duration-200 border',
              qty > 0
                ? 'bg-white border-orange-600 shadow-xs ring-2 ring-orange-600/20'
                : 'bg-white border-slate-200 hover:border-slate-300',
            ].join(' ')}
            id={`item-card-${tier.code}`}
          >
            {/* Left: Tile Image + Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Tile Container with Clean Transparent PNG Product Image */}
              <div className={`w-20 h-20 ${config.bg} rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden p-2 shadow-2xs border border-stone-200/50`}>
                <Image
                  src={config.src}
                  alt={config.alt}
                  width={64}
                  height={64}
                  className="object-contain max-h-16 max-w-16 drop-shadow-sm hover:scale-105 transition-transform"
                />
              </div>

              <div className="min-w-0 pr-2">
                <h4 className="text-base sm:text-lg font-bold text-[#1C130E] tracking-tight leading-tight">
                  {tier.name}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-2 leading-snug font-medium">
                  {tier.description || tier.supported_items}
                </p>
                <p className="text-xs sm:text-sm font-black text-orange-600 mt-1.5">
                  {formatPrice(rate)} <span className="text-slate-400 font-normal">/ day</span>
                </p>
              </div>
            </div>

            {/* Right: Circular Stepper */}
            <div
              className="flex items-center gap-3 flex-shrink-0"
              role="group"
              aria-label={`Quantity for ${tier.name}`}
            >
              <button
                type="button"
                onClick={() => onQuantityChange(tier.id, -1)}
                disabled={qty === 0}
                id={`decrement-${tier.code}`}
                aria-label={`Remove ${tier.name}`}
                className={[
                  'w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center transition-all cursor-pointer select-none',
                  qty === 0
                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                    : 'bg-white text-slate-800 hover:bg-slate-100 active:bg-slate-200 shadow-2xs',
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
        );
      })}
    </div>
  );
}
