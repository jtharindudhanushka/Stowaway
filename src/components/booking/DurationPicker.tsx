'use client';

import React from 'react';
import type { DurationType } from './ItemSelector';

interface DurationPickerProps {
  durationType: DurationType;
  durationValue: number;
  onTypeChange: (type: DurationType) => void;
  onValueChange: (value: number) => void;
}

const TYPES: { value: DurationType; label: string; unitLabel: string }[] = [
  { value: 'daily',   label: 'Daily',   unitLabel: 'days' },
  { value: 'weekly',  label: 'Weekly',  unitLabel: 'weeks' },
  { value: 'monthly', label: 'Monthly', unitLabel: 'months' },
];

const MAX: Record<DurationType, number> = {
  daily: 30,
  weekly: 12,
  monthly: 12,
};

export function DurationPicker({
  durationType,
  durationValue,
  onTypeChange,
  onValueChange,
}: DurationPickerProps) {
  const maxVal = MAX[durationType];
  const unitLabel = TYPES.find(t => t.value === durationType)?.unitLabel ?? 'days';

  return (
    <div className="flex flex-col gap-3" id="duration-picker">
      {/* Type toggle — pill buttons */}
      <div
        className="flex gap-2 p-1 rounded-full bg-[#f4f4f5] w-fit"
        role="group"
        aria-label="Duration type"
      >
        {TYPES.map(({ value, label }) => (
          <button
            key={value}
            id={`duration-type-${value}`}
            onClick={() => { onTypeChange(value); onValueChange(1); }}
            aria-pressed={durationType === value}
            className={[
              'px-4 py-1.5 rounded-full text-[14px] font-[500] transition-all duration-150',
              '[font-feature-settings:"ss03"]',
              durationType === value
                ? 'bg-black text-white shadow-sm'
                : 'text-[#52525b] hover:text-black',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center gap-3" aria-label={`Number of ${unitLabel}`}>
        <button
          onClick={() => onValueChange(Math.max(1, durationValue - 1))}
          disabled={durationValue <= 1}
          id="duration-decrement"
          aria-label={`Decrease ${unitLabel}`}
          className={[
            'w-10 h-10 rounded-full border flex items-center justify-center text-xl font-light transition-all',
            durationValue <= 1
              ? 'border-[#d4d4d8] text-[#a1a1aa] cursor-not-allowed'
              : 'border-black text-black hover:bg-black hover:text-white',
          ].join(' ')}
        >
          −
        </button>

        <div className="text-center min-w-[80px]">
          <span className="text-heading-xl font-[500] tabular-nums" aria-live="polite">
            {durationValue}
          </span>
          <span className="text-caption text-[#71717a] ml-1">{unitLabel}</span>
        </div>

        <button
          onClick={() => onValueChange(Math.min(maxVal, durationValue + 1))}
          disabled={durationValue >= maxVal}
          id="duration-increment"
          aria-label={`Increase ${unitLabel}`}
          className={[
            'w-10 h-10 rounded-full border flex items-center justify-center text-xl font-light transition-all',
            durationValue >= maxVal
              ? 'border-[#d4d4d8] text-[#a1a1aa] cursor-not-allowed'
              : 'border-black text-black hover:bg-black hover:text-white',
          ].join(' ')}
        >
          +
        </button>
      </div>
    </div>
  );
}
