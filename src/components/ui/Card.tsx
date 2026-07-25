import React from 'react';

type CardVariant =
  | 'pricing'           // white bg, hairline border, stacked-shadow — light track
  | 'pricing-featured'  // aloe fill — highlighted tier
  | 'cinematic'         // near-black, top-edge glow — dark track
  | 'pistachio-band'    // pistachio fill — wide feature band
  | 'photo-frame'       // pure black, no padding, rounded-xl
  | 'plain';            // no styling, just structural

interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  as?: React.ElementType;
}

const variantStyles: Record<CardVariant, string> = {
  pricing: [
    'bg-white text-black',
    'rounded-xl',
    'p-8',
    'border border-[#e4e4e7]',
    /* Level 3 — stacked tiny shadows paper halo */
    'shadow-[0_8px_8px_rgba(0,0,0,0.10),0_4px_4px_rgba(0,0,0,0.10),0_2px_2px_rgba(0,0,0,0.10),0_0_0_1px_rgba(0,0,0,0.08)]',
    'transition-transform duration-200 hover:-translate-y-0.5',
  ].join(' '),

  'pricing-featured': [
    'bg-[#c1fbd4] text-black',
    'rounded-xl',
    'p-8',
    'border border-transparent',
    'shadow-[0_8px_8px_rgba(0,0,0,0.10),0_4px_4px_rgba(0,0,0,0.10),0_2px_2px_rgba(0,0,0,0.10),0_0_0_1px_rgba(0,0,0,0.08)]',
    'transition-transform duration-200 hover:-translate-y-0.5',
  ].join(' '),

  cinematic: [
    'bg-[#0a0a0a] text-white',
    'rounded-xl',
    'p-8',
    /* Level 1 — inset top-edge sheen */
    'shadow-[0_1px_2px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.06)]',
    'border border-[#1e2c31]',
  ].join(' '),

  'pistachio-band': [
    'bg-[#d4f9e0] text-black',
    'rounded-xl',
    'p-8',
  ].join(' '),

  'photo-frame': [
    'bg-black',
    'rounded-[20px]',
    'overflow-hidden',
    'p-0',
  ].join(' '),

  plain: '',
};

export function Card({
  variant = 'plain',
  children,
  className = '',
  onClick,
  as: Tag = 'div',
}: CardProps) {
  // Dynamic tag is safe here
  return (
    <Tag
      className={[variantStyles[variant], className].join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </Tag>
  );
}
