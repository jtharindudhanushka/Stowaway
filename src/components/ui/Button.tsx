'use client';

import React from 'react';

type ButtonVariant =
  | 'primary'        // black pill, white text — dominant CTA
  | 'outline-dark'   // black bg, white stroke — cinematic hero CTA
  | 'outline-light'  // white bg, black stroke — light track CTA
  | 'aloe'           // mint fill — featured "Book Now" CTA
  | 'ghost';         // transparent, minimal

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-black text-white border-transparent hover:bg-[#3f3f46] active:bg-[#3f3f46]',
  'outline-dark':
    'bg-black text-white border-2 border-white hover:bg-white hover:text-black',
  'outline-light':
    'bg-white text-black border border-black hover:bg-black hover:text-white',
  aloe:
    'bg-[#c1fbd4] text-black border-transparent hover:bg-[#a8f5c0] active:bg-[#8fefac]',
  ghost:
    'bg-transparent text-inherit border-transparent hover:bg-white/10',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm min-h-[36px]',
  md: 'px-6 py-3 text-base min-h-[44px]',
  lg: 'px-8 py-4 text-lg min-h-[52px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        // Pill shape — non-negotiable per Design.md
        'rounded-full',
        'font-[Inter_Variable,Inter,sans-serif]',
        'font-[420]',
        '[font-feature-settings:"ss03"]',
        'transition-all duration-150 ease-in-out',
        'cursor-pointer select-none',
        'inline-flex items-center justify-center gap-2',
        'border',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <>
          <Spinner />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
