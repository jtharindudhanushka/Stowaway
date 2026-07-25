import React from 'react';

type PillVariant = 'mint' | 'shade' | 'pistachio' | 'dark';

interface PillTagProps {
  variant?: PillVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<PillVariant, string> = {
  mint:      'bg-[#c1fbd4] text-black',
  shade:     'bg-[#d4d4d8] text-black',
  pistachio: 'bg-[#d4f9e0] text-black',
  dark:      'bg-[#1e2c31] text-white',
};

export function PillTag({ variant = 'mint', children, className = '' }: PillTagProps) {
  return (
    <span
      className={[
        'inline-flex items-center',
        'rounded-full',
        'px-3 py-1',
        'text-[12px] font-[400] tracking-[0.72px] uppercase leading-[1.2]',
        '[font-feature-settings:"ss03"]',
        'font-[Inter_Variable,Inter,sans-serif]',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
