import React from 'react';

type CardVariant =
  | 'content'             // white bg, default spacing
  | 'elevated'            // white bg, Level 1 shadow
  | 'soft-tinted'         // light gray bg
  | 'promo-illustrated'   // white bg, large typography
  | 'promo-on-dark'       // black bg, white text
  | 'request-form'        // white bg, Level 2 shadow, for the main widget
  | 'plain';              // no styling, structural

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  as?: React.ElementType;
}

const variantStyles: Record<CardVariant, string> = {
  content: [
    'bg-[var(--color-canvas)] text-[var(--color-ink)]',
    'rounded-[var(--radius-xl)]',
    'p-[var(--space-2xl)]',
  ].join(' '),

  elevated: [
    'bg-[var(--color-canvas)] text-[var(--color-ink)]',
    'rounded-[var(--radius-xl)]',
    'p-[var(--space-2xl)]',
    'shadow-[var(--shadow-1)]',
  ].join(' '),

  'soft-tinted': [
    'bg-[var(--color-canvas-soft)] text-[var(--color-ink)]',
    'rounded-[var(--radius-xl)]',
    'p-[var(--space-2xl)]',
  ].join(' '),

  'promo-illustrated': [
    'bg-[var(--color-canvas)] text-[var(--color-ink)]',
    'rounded-[var(--radius-xl)]',
    'p-[var(--space-2xl)]',
  ].join(' '),

  'promo-on-dark': [
    'bg-[var(--color-ink)] text-[var(--color-on-dark)]',
    'rounded-[var(--radius-xl)]',
    'p-[var(--space-2xl)]',
  ].join(' '),

  'request-form': [
    'bg-[var(--color-canvas)] text-[var(--color-ink)]',
    'rounded-[var(--radius-xl)]',
    'p-[var(--space-lg)]',
    'shadow-[var(--shadow-2)]',
  ].join(' '),

  plain: '',
};

export function Card({
  variant = 'plain',
  children,
  className = '',
  onClick,
  as: Tag = 'div',
  ...props
}: CardProps) {
  return (
    <Tag
      className={[variantStyles[variant], className].join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
}
