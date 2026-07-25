'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Mail, Key, CheckCircle2 } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onVerified: () => void;
}

export function EmailVerificationModal({
  isOpen,
  email,
  onClose,
  onVerified,
}: EmailVerificationModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [demoCode, setDemoCode] = useState('8492');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      setError('');
      setTimeout(() => inputRefs[0].current?.focus(), 150);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...pin];
    next[index] = value.slice(-1);
    setPin(next);
    if (value && index < 3) inputRefs[index + 1].current?.focus();
    if (next.every(d => d !== '') && value) {
      handleVerify(next.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async (codeOverride?: string) => {
    const code = codeOverride ?? pin.join('');
    if (code.length < 4) {
      setError('Enter all 4 digits.');
      return;
    }
    setError('');
    setLoading(true);
    // Simulate email PIN verification delay
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    onVerified();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Scrim */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Email verification"
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <Mail className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Email Verification</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <h2 className="text-xl font-bold text-slate-900">
            Verify your email address
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-4 leading-relaxed">
            We've sent a 4-digit PIN code to <strong className="text-slate-900">{email}</strong> to verify your confirmation receipt email.
          </p>

          {/* Demo code notice */}
          <div className="flex items-center gap-3 mb-6 p-3.5 bg-amber-50 border border-amber-300 rounded-xl">
            <Key className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Demo Email PIN</p>
              <span className="text-xl font-bold tracking-widest font-mono text-amber-950">{demoCode}</span>
            </div>
          </div>

          {/* 4-digit PIN inputs */}
          <div
            className="flex gap-3 justify-center my-6"
            role="group"
            aria-label="Email PIN input"
          >
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                id={`email-pin-digit-${i}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                value={digit}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={[
                  'w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all tabular-nums',
                  digit
                    ? 'border-orange-600 bg-orange-50 text-orange-950 shadow-2xs'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 focus:outline-none',
                ].join(' ')}
              />
            ))}
          </div>

          {error && <p className="text-xs font-semibold text-red-600 text-center mb-4">{error}</p>}

          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => handleVerify()}
            loading={loading}
            disabled={pin.some(d => !d)}
            className="font-bold py-4 text-base"
          >
            Verify Email & Proceed
          </Button>
        </div>
      </div>
    </div>
  );
}
