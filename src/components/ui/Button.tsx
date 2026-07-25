'use client';

import React from 'react';

type ButtonVariant =
  | 'primary'          // Orange pill, white text — dominant CTA
  | 'secondary'        // Dark Brown pill, white text
  | 'subtle'           // Soft Stone/Ivory pill, dark text
  | 'floating'         // White pill with shadow
  | 'outline'          // Bordered pill
  | 'ghost';           // Transparent

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
    'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800 shadow-xs font-bold',
  secondary:
    'bg-[#1C130E] text-white hover:bg-[#2E1C14] active:bg-[#382319] font-bold',
  subtle:
    'bg-stone-100 text-stone-900 hover:bg-stone-200 font-semibold',
  floating:
    'bg-white text-stone-900 shadow-md hover:bg-stone-50 font-bold',
  outline:
    'bg-transparent border border-stone-300 text-stone-900 hover:bg-stone-50 font-semibold',
  ghost:
    'bg-transparent text-stone-900 hover:bg-stone-100 font-semibold',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs min-h-[36px]',
  md: 'px-5 py-3 text-sm min-h-[44px]',
  lg: 'px-7 py-4 text-base min-h-[52px]',
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
        'rounded-full',
        'font-sans',
        'transition-all duration-150 ease-in-out',
        'cursor-pointer select-none',
        'inline-flex items-center justify-center gap-2',
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
