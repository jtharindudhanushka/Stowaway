import React from 'react';

type PillVariant = 'soft' | 'dark' | 'outline' | 'mint' | 'shade' | 'pistachio';

interface PillTagProps {
  variant?: PillVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<PillVariant, string> = {
  soft:      'bg-[var(--color-canvas-soft)] text-[var(--color-ink)]',
  dark:      'bg-[var(--color-ink)] text-[var(--color-on-dark)]',
  outline:   'bg-transparent text-[var(--color-ink)] border border-[var(--color-surface-pressed)]',
  mint:      'bg-[var(--color-canvas-soft)] text-[var(--color-ink)]', // Legacy mapping
  shade:     'bg-[var(--color-canvas-soft)] text-[var(--color-ink)]', // Legacy mapping
  pistachio: 'bg-[var(--color-canvas-soft)] text-[var(--color-ink)]', // Legacy mapping
};

export function PillTag({ variant = 'soft', children, className = '' }: PillTagProps) {
  return (
    <span
      className={[
        'inline-flex items-center',
        'rounded-[var(--radius-pill)]',
        'px-[var(--space-md)] py-[var(--space-xs)]',
        'text-body-sm-strong uppercase tracking-wide',
        'font-[Inter,system-ui,sans-serif]',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
