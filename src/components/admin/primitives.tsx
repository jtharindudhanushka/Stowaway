'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

/**
 * Run a loader once on mount and whenever it changes.
 *
 * The loaders here flip a `loading` flag as their first statement, which
 * would be a synchronous setState inside the effect body — the pattern
 * React's compiler warns about, since it cascades an extra render before
 * paint. Deferring by a microtask moves the state update out of the effect
 * body while still starting the fetch immediately, and gives us a
 * cancellation point for unmount.
 */
export function useDeferredLoad(load: () => void | Promise<void>) {
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);
}

/**
 * Shared form and layout primitives for the admin panel.
 *
 * The previous panel repeated the same input markup dozens of times inline,
 * which is why validation and error display were inconsistent between tabs.
 */

// ── Panel scaffolding ───────────────────────────────────────────

export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold text-[#1C130E] tracking-tight">{title}</h1>
        {description && <p className="text-sm font-medium text-slate-500 mt-1 max-w-2xl">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 mb-5">
      <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
      {description && <p className="text-xs font-medium text-slate-500 mt-0.5 mb-4">{description}</p>}
      <div className={description ? '' : 'mt-4'}>{children}</div>
    </section>
  );
}

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5
                 text-sm font-semibold text-red-800"
    >
      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Dismiss error" className="cursor-pointer text-red-500 hover:text-red-700">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-14 border-2 border-dashed border-slate-200 rounded-2xl">
      <p className="text-sm font-bold text-slate-700">{title}</p>
      {hint && <p className="text-xs font-medium text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

// ── Inputs ──────────────────────────────────────────────────────

const fieldBase =
  'w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 ' +
  'placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all';

export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  id,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  id: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'id'>) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={[
          fieldBase,
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
            : 'border-slate-300 focus:border-orange-600 focus:ring-orange-600/20',
        ].join(' ')}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="text-[11px] font-bold text-red-600 mt-1">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[11px] font-medium text-slate-400 mt-1">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  prefix,
  error,
  hint,
  id,
  ...rest
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  error?: string;
  hint?: string;
  id: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'id' | 'prefix'>) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={[
            fieldBase,
            prefix ? 'pl-8' : '',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300 focus:border-orange-600 focus:ring-orange-600/20',
          ].join(' ')}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-[11px] font-bold text-red-600 mt-1">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[11px] font-medium text-slate-400 mt-1">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Accessible switch. Used for every boolean setting in the panel. */
export function Toggle({
  label,
  description,
  checked,
  onChange,
  id,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <label
          htmlFor={id}
          className={['text-sm font-bold text-slate-900', disabled ? 'opacity-50' : 'cursor-pointer select-none'].join(' ')}
          onClick={(e) => {
            if (!disabled) {
              e.preventDefault();
              onChange(!checked);
            }
          }}
        >
          {label}
        </label>
        {description && <p className="text-xs font-medium text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          checked ? 'bg-orange-600' : 'bg-slate-300',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className={[
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

/** Inline "saved" acknowledgement that fades on its own. */
export function SavedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 animate-fade-in">
      <Check className="w-3.5 h-3.5" strokeWidth={3} /> Saved
    </span>
  );
}

/** Destructive-action confirmation. Never archive on a single click. */
export function ConfirmBar({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  busy,
}: {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-red-50 border border-red-200 flex-wrap">
      <p className="text-xs font-bold text-red-800 min-w-0">{message}</p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onCancel}
          disabled={busy}
          className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:bg-white transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-600 text-white hover:bg-red-700
                     transition-colors cursor-pointer disabled:opacity-50"
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </div>
  );
}
